import random
from typing import Any
from uuid import UUID

from fastapi import HTTPException

from app.domain.interfaces import (
    IPracticeSessionRepository,
    IQuestionRepository,
)
from app.domain.value_objects import PracticeSessionStatus
from app.domain.value_objects.gamification import ITEM_PRICES, GamificationItem
from app.presentation.schemas.practice import GamificationUseItemIn


class UseItemPracticeUseCase:
    def __init__(
        self, ps_repo: IPracticeSessionRepository, question_repo: IQuestionRepository
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo

    async def execute(
        self, session_id: UUID, user_id: int, payload: GamificationUseItemIn
    ) -> dict[str, Any] | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Practice session not found")

        if session.status != PracticeSessionStatus.IN_PROGRESS:
            raise HTTPException(status_code=400, detail="Session is not in progress")

        if not session.snapshot or "gamification" not in session.snapshot:
            raise HTTPException(status_code=400, detail="Not a gamified session")

        # Find current question
        questions = session.snapshot.get("questions", [])
        current_idx = session.snapshot["gamification"].get("last_question_index", 0)
        if current_idx >= len(questions):
            raise HTTPException(
                status_code=400, detail="All questions already answered"
            )

        current_q = questions[current_idx]
        if current_q["id"] != str(payload.question_id):
            raise HTTPException(
                status_code=400,
                detail="Question ID does not match current question index",
            )

        try:
            item = GamificationItem(payload.item_name.lower())
        except ValueError:
            raise HTTPException(
                status_code=400, detail=f"Invalid item: {payload.item_name}"
            )

        is_boss = current_q.get("is_boss", False)
        price_multiplier = 2 if is_boss else 1
        price = ITEM_PRICES[item] * price_multiplier

        gold = session.snapshot["gamification"].get("gold", 0)
        if gold < price:
            raise HTTPException(
                status_code=400, detail="Not enough gold to use this item"
            )

        # Process item
        result = {}
        if item == GamificationItem.MICROSCOPE:
            q_db = await self._question_repo.get(payload.question_id)
            if not q_db:
                raise HTTPException(status_code=404, detail="Question not found")

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

            from datetime import datetime, timedelta

            started_at_str = session.snapshot["gamification"].get(
                "current_question_started_at"
            )
            if started_at_str:
                started_at = datetime.fromisoformat(started_at_str)
                # Dời thời điểm bắt đầu lên 30s -> người dùng có thêm 30s để trả lời
                new_started_at = started_at + timedelta(seconds=30)
                session.snapshot["gamification"]["current_question_started_at"] = (
                    new_started_at.isoformat()
                )
        else:
            raise HTTPException(
                status_code=400,
                detail=f"Item {item.value} must be activated when submitting your answer",
            )

        # Deduct gold and save
        session.snapshot["gamification"]["gold"] = gold - price
        await self._ps_repo.save(session)

        result["gold"] = session.snapshot["gamification"]["gold"]
        return result
