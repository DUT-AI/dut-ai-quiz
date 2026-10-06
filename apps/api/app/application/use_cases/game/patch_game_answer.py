from datetime import datetime
from uuid import UUID

from app.core.datetime_utils import now_ict
from app.domain.entities.homework import SubmissionType
from app.domain.entities.user import UserSource
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
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.infrastructure.services.manage_webhook import dispatch_manage_submission_webhook
from app.presentation.schemas.game import (
    GamificationAnswerPatchIn,
    GamificationAnswerResultOut,
)


class PatchGameAnswerUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        cache: GameLeaderboardCache | None = None,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._cache = cache

    async def execute(
        self,
        session_id: UUID,
        user_id: int,
        payload: GamificationAnswerPatchIn,
        user_source: UserSource = UserSource.MANAGE,
    ) -> GamificationAnswerResultOut:
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

        # Verify answer correctness from DB
        q_db = await self._question_repo.get(payload.question_id)
        if not q_db:
            raise EntityNotFoundException("Question not found")

        correct_opt_id = None
        for opt in q_db.options:
            if opt.is_correct:
                correct_opt_id = opt.id
                break

        is_correct = str(payload.option_id) == str(correct_opt_id)

        # Anti-cheat check: allow 10 seconds buffer for network latency/UI animations
        if state.current_question_started_at:
            started_at = datetime.fromisoformat(state.current_question_started_at)
            elapsed = (now_ict() - started_at).total_seconds()
            time_limit = current_q.time_limit

            if elapsed > time_limit + 10.0:
                is_correct = False
                payload.time_response = float(time_limit)

        # Calculate item costs
        cost = 0
        if payload.activate_double_points:
            cost += state.get_item_price(GamificationItem.DOUBLE_POINTS, is_boss=current_q.is_boss)
        if payload.activate_shield:
            if not state.can_use_shield_in_tier(current_q.tier):
                raise DomainValidationException(f"Shield already used in Tier {current_q.tier}")
            cost += state.get_item_price(GamificationItem.SHIELD, is_boss=current_q.is_boss)

        if not state.has_enough_gold(cost):
            raise InsufficientResourceException("Not enough gold to activate items")

        # Deduct item costs and record usages
        state.deduct_gold(cost)
        if payload.activate_shield:
            state.record_shield_used(current_q.tier)

        # Calculate Points & Gold rewards
        points_gained = 0
        coins_gained = 0

        if is_correct:
            points_gained, coins_gained = state.record_correct_answer(
                time_response=payload.time_response,
                time_limit=current_q.time_limit,
                is_boss=current_q.is_boss,
                double_points=payload.activate_double_points,
            )
        else:
            state.record_incorrect_answer(
                is_boss=current_q.is_boss,
                shield_activated=payload.activate_shield,
            )

        # Record answer and time response
        snap.record_answer(payload.question_id, payload.option_id, payload.time_response)

        # Advance question index
        state.advance_question(snap.questions)

        # Check game over conditions
        is_game_over = snap.is_game_over()
        if is_game_over:
            session.status = GameSessionStatus.COMPLETED
            session.completed_at = now_ict()

            lesson_slug = snap.lesson_slug or (
                session.tags_filter[0] if session.tags_filter else "unknown"
            )
            count_completed = await self._ps_repo.count_completed_by_lesson(user_id, lesson_slug)
            state.finalize_score(count_completed)

            if self._cache:
                await self._cache.invalidate(lesson_slug)

            # Kiểm tra tiêu chuẩn hoàn thành game: đúng 100% câu hỏi
            if snap.is_100_percent_correct() and session.status == GameSessionStatus.COMPLETED:
                dispatch_manage_submission_webhook(
                    lesson_slug=lesson_slug,
                    user_id=user_id,
                    submission_type=SubmissionType.GAME,
                    submitted_at=session.completed_at or now_ict(),
                    is_passed=True,
                    details={
                        "session_id": str(session.id),
                        "final_score": float(state.final_score),
                        "correct_count": state.correct_count,
                        "total_questions": len(snap.questions),
                    },
                    user_source=user_source,
                )

        # Set started_at for next question
        state.reset_question_timer()

        session.set_snapshot_state(snap)
        await self._ps_repo.save(session)

        return GamificationAnswerResultOut(
            is_correct=is_correct,
            points_gained=points_gained,
            coins_gained=coins_gained,
            updated_gamification=state.to_dict(),
            is_game_over=is_game_over,
            correct_option_id=str(correct_opt_id) if correct_opt_id else None,
        )
