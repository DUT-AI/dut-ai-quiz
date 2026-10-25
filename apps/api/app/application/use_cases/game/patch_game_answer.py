from uuid import UUID, uuid4

from app.application.services.game_hydration import GameHydrationService
from app.core.datetime_utils import now_ict
from app.domain.entities.game_answer import GameSessionAnswerEntity
from app.domain.entities.homework import SubmissionType
from app.domain.entities.user import UserSource
from app.domain.exceptions import (
    DomainValidationException,
    EntityNotFoundException,
    InsufficientResourceException,
)
from app.domain.interfaces import (
    IGameSessionAnswerRepository,
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
    GamificationStateOut,
)


class PatchGameAnswerUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        answer_repo: IGameSessionAnswerRepository,
        hydration: GameHydrationService,
        cache: GameLeaderboardCache | None = None,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._answer_repo = answer_repo
        self._hydration = hydration
        self._cache = cache

    async def execute(
        self,
        session_id: UUID,
        user_id: int,
        payload: GamificationAnswerPatchIn,
        user_source: UserSource = UserSource.MANAGE,
    ) -> GamificationAnswerResultOut:
        session = await self._ps_repo.get(session_id, for_update=True)
        if not session or session.user_id != user_id:
            raise EntityNotFoundException("Game session not found")

        if session.status != GameSessionStatus.IN_PROGRESS:
            raise DomainValidationException("Session is not in progress")

        state = session.gamification

        # Check if this question was already answered (Idempotency / duplicate check)
        prev_answer = await self._answer_repo.get_by_turn(session_id, payload.question_id)
        if prev_answer:
            if str(prev_answer.option_id) == str(payload.option_id):
                next_q_out = None
                next_meta = session.current_question_meta
                if next_meta and not session.is_game_over:
                    next_q_out = await self._hydration.hydrate_question_snapshot(next_meta)

                return GamificationAnswerResultOut(
                    is_correct=prev_answer.is_correct,
                    points_gained=0,
                    coins_gained=0,
                    updated_gamification=GamificationStateOut.model_validate(state.to_dict()),
                    is_game_over=session.is_game_over,
                    correct_option_id=str(payload.option_id) if prev_answer.is_correct else None,
                    next_question=next_q_out,
                )
            raise DomainValidationException("Question already answered")

        current_q = session.current_question_meta
        if not current_q:
            raise DomainValidationException("All questions already answered")

        if str(current_q.id) != str(payload.question_id):
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

        # Validate time_response from client within bounds
        time_limit = current_q.time_limit
        if payload.time_response > time_limit:
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

        # Record answer time response in state
        state.add_time_response(payload.time_response)

        # Append answer record into game_session_answers table
        ans_entity = GameSessionAnswerEntity(
            id=uuid4(),
            session_id=session.id,
            question_id=payload.question_id,
            option_id=str(payload.option_id),
            is_correct=is_correct,
            time_response=payload.time_response,
            points_gained=points_gained,
            gold_gained=coins_gained,
            answered_at=now_ict(),
        )

        await self._answer_repo.add(ans_entity)

        # Advance question index
        state.advance_question(session.question_sequence)

        # Check game over conditions
        is_game_over = session.is_game_over
        if is_game_over:
            session.status = GameSessionStatus.COMPLETED
            session.completed_at = now_ict()

            lesson_slug = session.lesson_slug or "unknown"
            count_completed = await self._ps_repo.count_completed_by_lesson(user_id, lesson_slug)
            state.finalize_score(count_completed)

            if self._cache:
                await self._cache.invalidate(lesson_slug)

            # Check completion criteria: reached end with remaining lives
            is_completed = (
                session.is_all_answered and state.lives > 0
            ) and session.status == GameSessionStatus.COMPLETED
            if is_completed:
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
                        "total_questions": len(session.question_sequence),
                    },
                    user_source=user_source,
                )

        await self._ps_repo.save(session)

        # Resolve next question snapshot if available
        next_q_out = None
        next_meta = session.current_question_meta
        if next_meta and not is_game_over:
            next_q_out = await self._hydration.hydrate_question_snapshot(next_meta)

        return GamificationAnswerResultOut(
            is_correct=is_correct,
            points_gained=points_gained,
            coins_gained=coins_gained,
            updated_gamification=GamificationStateOut.model_validate(state.to_dict()),
            is_game_over=is_game_over,
            correct_option_id=str(correct_opt_id) if correct_opt_id else None,
            next_question=next_q_out,
        )
