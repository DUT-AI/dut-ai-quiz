from uuid import UUID

from app.application.services.game_items.registry import GameItemRegistry
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
from app.domain.value_objects.game_items import ItemExecutionContext
from app.presentation.schemas.game import (
    GamificationStateOut,
    GamificationUseItemIn,
    GamificationUseItemResultOut,
)


class UseItemGameUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        item_registry: GameItemRegistry,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._item_registry = item_registry

    async def execute(
        self, session_id: UUID, user_id: int, payload: GamificationUseItemIn
    ) -> GamificationUseItemResultOut:
        session = await self._ps_repo.get(session_id, for_update=True)
        if not session or session.user_id != user_id:
            raise EntityNotFoundException("Game session not found")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise DomainValidationException("Session is not in progress")

        strategy = self._item_registry.get_by_name(payload.item_name)
        context = ItemExecutionContext(
            question_id=payload.question_id,
            current_question_meta=session.current_question_meta,
            question_repo=self._question_repo,
        )

        strategy.validate(session, context)
        price = strategy.calculate_price(session, context)

        state = session.gamification
        if not state.has_enough_gold(price):
            raise InsufficientResourceException("Not enough gold to use this item")

        result = await strategy.apply(session, context)

        # Deduct gold and persist session atomically
        state.deduct_gold(price)
        await self._ps_repo.save(session)

        return GamificationUseItemResultOut(
            item_name=result.item_name,
            eliminated_option_ids=result.eliminated_option_ids,
            time_freeze_active=result.time_freeze_active,
            updated_gamification=GamificationStateOut.model_validate(state.to_dict()),
        )
