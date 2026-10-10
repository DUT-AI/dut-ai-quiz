import random
from typing import Any
from uuid import UUID

from app.domain.exceptions import (
    DomainValidationException,
    EntityNotFoundException,
    InsufficientResourceException,
)
from app.domain.interfaces import (
    IGameSessionRepository,
    IQuestionRepository,
)
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import GamificationItem
from app.presentation.schemas.game import GamificationUseItemIn


class UseItemGameUseCase:
    def __init__(self, ps_repo: IGameSessionRepository, question_repo: IQuestionRepository):
        self._ps_repo = ps_repo
        self._question_repo = question_repo

    async def execute(
        self, session_id: UUID, user_id: int, payload: GamificationUseItemIn
    ) -> dict[str, Any] | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise EntityNotFoundException("Game session not found")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise DomainValidationException("Session is not in progress")

        if not session.snapshot:
            raise DomainValidationException("Not a gamified session")

        snap = session.get_snapshot_state()
        state = snap.gamification

        current_q = snap.current_question()
        if not current_q:
            raise DomainValidationException("All questions already answered")

        if current_q.id != str(payload.question_id):
            raise DomainValidationException("Question ID does not match current question index")

        try:
            item = GamificationItem(payload.item_name.lower())
        except ValueError as exc:
            raise DomainValidationException(f"Invalid item: {payload.item_name}") from exc

        price = state.get_item_price(item, is_boss=current_q.is_boss)
        if not state.has_enough_gold(price):
            raise InsufficientResourceException("Not enough gold to use this item")

        # Process item
        result = {}
        if item == GamificationItem.MICROSCOPE:
            q_db = await self._question_repo.get(payload.question_id)
            if not q_db:
                raise EntityNotFoundException("Question not found")

            correct_opt_id = None
            all_opt_ids = []
            for opt in q_db.options:
                all_opt_ids.append(opt.id)
                if opt.is_correct:
                    correct_opt_id = opt.id

            incorrect_opt_ids = [oid for oid in all_opt_ids if oid != correct_opt_id]
            if len(incorrect_opt_ids) >= 2:
                eliminated = random.sample(incorrect_opt_ids, 2)
            else:
                eliminated = incorrect_opt_ids

            result["eliminated_option_ids"] = eliminated
        elif item == GamificationItem.TIME_FREEZE:
            result["time_freeze_active"] = True
            state.apply_time_freeze(seconds=30)
        else:
            raise DomainValidationException(
                f"Item {item.value} must be activated when submitting your answer"
            )

        # Deduct gold and save
        state.deduct_gold(price)
        session.set_snapshot_state(snap)
        await self._ps_repo.save(session)

        result["gold"] = state.gold
        return result
