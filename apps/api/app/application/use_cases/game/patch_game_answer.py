from uuid import UUID

from app.domain.interfaces import (
    IGameSessionRepository,
    IQuestionRepository,
)
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import ITEM_PRICES, GamificationItem
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.presentation.schemas.game import (
    GamificationAnswerPatchIn,
    GamificationAnswerResultOut,
)
from fastapi import HTTPException


class PatchGameAnswerUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        cache: GameLeaderboardCache = None,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._cache = cache

    async def execute(
        self, session_id: UUID, user_id: int, payload: GamificationAnswerPatchIn
    ) -> GamificationAnswerResultOut:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise HTTPException(status_code=404, detail="Game session not found")

        if session.status != GameSessionStatus.IN_PROGRESS:
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

        # Verify answer correctness from DB
        q_db = await self._question_repo.get(payload.question_id)
        if not q_db:
            raise HTTPException(status_code=404, detail="Question not found")

        correct_opt_id = None
        for opt in q_db.options:
            if opt.is_correct:
                correct_opt_id = opt.id
                break

        is_correct = str(payload.option_id) == str(correct_opt_id)

        # Anti-cheat: Check if time limit exceeded
        from datetime import datetime

        from app.core.datetime_utils import now_ict

        started_at_str = session.snapshot["gamification"].get(
            "current_question_started_at"
        )
        if started_at_str:
            started_at = datetime.fromisoformat(started_at_str)
            elapsed = (now_ict() - started_at).total_seconds()
            time_limit = current_q.get("time_limit", 60)

            # Anti-cheat check: allow 10 seconds buffer for network latency/UI animations
            if elapsed > time_limit + 10.0:
                is_correct = False
                payload.time_response = float(time_limit)  # Max out the time response

        # Calculate item costs
        is_boss = current_q.get("is_boss", False)
        price_multiplier = 2 if is_boss else 1

        cost = 0
        current_tier = current_q.get("tier", 1)

        if payload.activate_double_points:
            cost += ITEM_PRICES[GamificationItem.DOUBLE_POINTS] * price_multiplier
        if payload.activate_shield:
            shield_used_in_tier = session.snapshot["gamification"].setdefault(
                "shield_used_in_tier", {}
            )
            if shield_used_in_tier.get(str(current_tier), False):
                raise HTTPException(
                    status_code=400,
                    detail=f"Shield already used in Tier {current_tier}",
                )
            cost += ITEM_PRICES[GamificationItem.SHIELD] * price_multiplier

        gold = session.snapshot["gamification"].get("gold", 0)
        if gold < cost:
            raise HTTPException(
                status_code=400, detail="Not enough gold to activate items"
            )

        # Deduct item costs
        gold -= cost
        session.snapshot["gamification"]["gold"] = gold

        # Record item usages
        if payload.activate_shield:
            session.snapshot["gamification"]["shield_used_in_tier"][
                str(current_tier)
            ] = True

        # Calculate Points & Gold rewards
        points_gained = 0
        coins_gained = 0

        if is_correct:
            base_points = 10
            time_limit = current_q.get("time_limit", 60)
            speed_ratio = payload.time_response / time_limit if time_limit > 0 else 1.0

            speed_points_bonus = 0
            speed_gold_bonus = 0
            if speed_ratio <= 0.3:
                speed_points_bonus = 5
                speed_gold_bonus = 15
            elif speed_ratio <= 0.6:
                speed_points_bonus = 2
                speed_gold_bonus = 5

            points_gained = base_points + speed_points_bonus
            coins_gained = 20 + speed_gold_bonus

            if is_boss:
                points_gained *= 2
            if payload.activate_double_points:
                points_gained *= 2

            session.snapshot["gamification"]["points"] = (
                session.snapshot["gamification"].get("points", 0) + points_gained
            )
            session.snapshot["gamification"]["gold"] = (
                session.snapshot["gamification"].get("gold", 0) + coins_gained
            )

            if is_boss:
                session.snapshot["gamification"]["boss_hp"] = 0
        else:
            if payload.activate_shield:
                pass
            else:
                lives_lost = 2 if is_boss else 1
                current_lives = session.snapshot["gamification"].get("lives", 3)
                session.snapshot["gamification"]["lives"] = max(
                    0, current_lives - lives_lost
                )

        # Record answer and time response
        session.snapshot["answers"][str(payload.question_id)] = str(payload.option_id)
        current_q["time_response"] = payload.time_response

        # Tự động cộng dồn tổng thời gian làm bài của toàn bộ session
        current_total_time = session.snapshot["gamification"].get(
            "total_time_response", 0.0
        )
        session.snapshot["gamification"]["total_time_response"] = (
            current_total_time + payload.time_response
        )

        # Check if we are advancing to next tier
        next_idx = current_idx + 1
        session.snapshot["gamification"]["last_question_index"] = next_idx

        if next_idx < len(questions):
            next_q = questions[next_idx]
            if next_q["tier"] > current_tier:
                current_lives = session.snapshot["gamification"].get("lives", 0)
                if current_lives > 0:
                    session.snapshot["gamification"]["lives"] = min(
                        5, current_lives + 2
                    )
                    session.snapshot["gamification"]["current_tier"] = next_q["tier"]
            session.snapshot["gamification"]["boss_hp"] = (
                1 if next_q.get("is_boss", False) else 0
            )
        else:
            session.snapshot["gamification"]["boss_hp"] = 0

        # Check game over conditions
        is_game_over = False
        if session.snapshot["gamification"].get("lives", 0) <= 0:
            is_game_over = True
            session.status = GameSessionStatus.COMPLETED
            session.completed_at = now_ict()
        elif next_idx >= len(questions):
            is_game_over = True
            session.status = GameSessionStatus.COMPLETED
            session.completed_at = now_ict()

        if is_game_over:
            lesson_slug = session.snapshot.get("lesson_slug") or (
                session.tags_filter[0] if session.tags_filter else "unknown"
            )
            count_completed = await self._ps_repo.count_completed_by_lesson(
                user_id, lesson_slug
            )
            decay = max(0.2, 1.0 - (count_completed * 0.2))
            base_points = session.snapshot["gamification"].get("points", 0)
            session.snapshot["gamification"]["final_score"] = base_points * decay
            session.snapshot["gamification"]["attempt_count"] = count_completed + 1

            if hasattr(self, "_cache") and self._cache:
                await self._cache.invalidate(lesson_slug)

        # Set started_at for next question
        session.snapshot["gamification"]["current_question_started_at"] = (
            now_ict().isoformat()
        )

        await self._ps_repo.save(session)

        return GamificationAnswerResultOut(
            is_correct=is_correct,
            points_gained=points_gained,
            coins_gained=coins_gained,
            updated_gamification=session.snapshot["gamification"],
            is_game_over=is_game_over,
            correct_option_id=str(correct_opt_id) if correct_opt_id else None,
        )
