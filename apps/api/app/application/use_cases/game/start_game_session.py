import random
from uuid import uuid4

from app.application.services.game_hydration import GameHydrationService
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.exceptions import DomainValidationException
from app.domain.interfaces import (
    IGameSessionRepository,
    ILessonRepository,
    IQuestionRepository,
)
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.domain.value_objects.gamification import (
    GamificationState,
    QuestionMeta,
)
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.presentation.schemas.game import GameSessionOut, GamificationStartIn


class StartGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        lesson_repo: ILessonRepository,
        hydration: GameHydrationService,
        cache: GameLeaderboardCache | None = None,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._lesson_repo = lesson_repo
        self._hydration = hydration
        self._cache = cache

    async def execute(self, user_id: int, payload: GamificationStartIn) -> GameSessionOut:
        # Auto-finish any existing IN_PROGRESS session for this lesson+user
        # so that the client never needs to call finishSession separately.
        existing = await self._ps_repo.get_active_by_lesson(user_id, payload.lesson_slug)
        if existing and existing.status == GameSessionStatus.IN_PROGRESS:
            existing.status = GameSessionStatus.COMPLETED
            existing.completed_at = now_ict()
            lesson_slug_for_decay = existing.lesson_slug or payload.lesson_slug
            count_completed = await self._ps_repo.count_completed_by_lesson(
                user_id, lesson_slug_for_decay
            )
            existing.gamification.finalize_score(count_completed)
            await self._ps_repo.save(existing)
            if self._cache:
                await self._cache.invalidate(lesson_slug_for_decay)

        # Find lesson by slug, id or name
        target_lesson_id = None
        if payload.lesson_slug:
            lesson = await self._lesson_repo.get_by_identifier(payload.lesson_slug)
            if lesson:
                target_lesson_id = lesson.id

        questions = await self._question_repo.list_all(
            pool_type=PoolType.GAME,
            lesson_id=target_lesson_id,
            offset=0,
            limit=1000,
        )

        if not questions:
            raise DomainValidationException(
                "Bài học này chưa có câu hỏi luyện tập thi đấu nào dưới database."
            )

        # Check user's history to prioritize unseen questions
        history = await self._ps_repo.list_history(user_id)
        seen_question_ids = set()
        for session in history:
            for q in session.question_sequence:
                if q.id:
                    seen_question_ids.add(str(q.id))

        def prioritize_and_order(q_list):
            unseen = [q for q in q_list if str(q.id) not in seen_question_ids]
            seen = [q for q in q_list if str(q.id) in seen_question_ids]
            random.shuffle(unseen)
            random.shuffle(seen)
            return unseen + seen

        # Target distribution: 3 EASY (Tier 1), 3 MEDIUM (Tier 2), 4 HARD (Tier 3) -> Total 10
        easy_pool = prioritize_and_order([q for q in questions if q.difficulty == Difficulty.EASY])
        med_pool = prioritize_and_order([q for q in questions if q.difficulty == Difficulty.MEDIUM])
        hard_pool = prioritize_and_order([q for q in questions if q.difficulty == Difficulty.HARD])

        target_easy = min(3, len(easy_pool))
        target_med = min(3, len(med_pool))
        target_hard = min(4, len(hard_pool))

        selected_easy = easy_pool[:target_easy]
        remaining_easy = easy_pool[target_easy:]

        selected_med = med_pool[:target_med]
        remaining_med = med_pool[target_med:]

        selected_hard = hard_pool[:target_hard]
        remaining_hard = hard_pool[target_hard:]

        # Smart replenishment if any tier is deficient
        total_selected = len(selected_easy) + len(selected_med) + len(selected_hard)
        needed = 10 - total_selected

        if needed > 0 and len(selected_hard) < 4:
            take_from_med = min(4 - len(selected_hard), len(remaining_med))
            selected_hard.extend(remaining_med[:take_from_med])
            remaining_med = remaining_med[take_from_med:]
            needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

            if needed > 0 and len(selected_hard) < 4:
                take_from_easy = min(4 - len(selected_hard), len(remaining_easy))
                selected_hard.extend(remaining_easy[:take_from_easy])
                remaining_easy = remaining_easy[take_from_easy:]
                needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

        if needed > 0 and len(selected_med) < 3:
            take_from_hard = min(3 - len(selected_med), len(remaining_hard))
            selected_med.extend(remaining_hard[:take_from_hard])
            remaining_hard = remaining_hard[take_from_hard:]
            needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

            if needed > 0 and len(selected_med) < 3:
                take_from_easy = min(3 - len(selected_med), len(remaining_easy))
                selected_med.extend(remaining_easy[:take_from_easy])
                remaining_easy = remaining_easy[take_from_easy:]
                needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

        if needed > 0 and len(selected_easy) < 3:
            take_from_med = min(3 - len(selected_easy), len(remaining_med))
            selected_easy.extend(remaining_med[:take_from_med])
            remaining_med = remaining_med[take_from_med:]
            needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

            if needed > 0 and len(selected_easy) < 3:
                take_from_hard = min(3 - len(selected_easy), len(remaining_hard))
                selected_easy.extend(remaining_hard[:take_from_hard])
                remaining_hard = remaining_hard[take_from_hard:]
                needed = 10 - (len(selected_easy) + len(selected_med) + len(selected_hard))

        # Final fill-up from any remaining pool to reach 10 if bank has available questions
        if (len(selected_easy) + len(selected_med) + len(selected_hard)) < 10:
            all_remaining = remaining_easy + remaining_med + remaining_hard
            fill_count = min(
                10 - (len(selected_easy) + len(selected_med) + len(selected_hard)),
                len(all_remaining),
            )
            selected_med.extend(all_remaining[:fill_count])

        question_sequence: list[QuestionMeta] = []

        # Tier 1 (Easy): Last question is Boss Fight of Tier 1
        for i, q in enumerate(selected_easy):
            is_boss = i == len(selected_easy) - 1
            question_sequence.append(
                QuestionMeta(
                    id=str(q.id),
                    tier=1,
                    is_boss=is_boss,
                    time_limit=30 if is_boss else 60,
                )
            )

        # Tier 2 (Medium): Last question is Boss Fight of Tier 2
        for i, q in enumerate(selected_med):
            is_boss = i == len(selected_med) - 1
            question_sequence.append(
                QuestionMeta(
                    id=str(q.id),
                    tier=2,
                    is_boss=is_boss,
                    time_limit=60 if is_boss else 120,
                )
            )

        # Tier 3 (Hard): Last question is Boss Fight of Tier 3 (Final Boss)
        for i, q in enumerate(selected_hard):
            is_boss = i == len(selected_hard) - 1
            question_sequence.append(
                QuestionMeta(
                    id=str(q.id),
                    tier=3,
                    is_boss=is_boss,
                    time_limit=120 if is_boss else 300,
                )
            )

        gamification = GamificationState(
            lives=3,
            gold=0,
            points=0,
            current_tier=1,
            last_question_index=0,
            boss_hp=1 if (question_sequence and question_sequence[0].is_boss) else 0,
            shield_used_in_tier={},
        )

        entity = GameSessionEntity(
            id=uuid4(),
            user_id=user_id,
            lesson_slug=payload.lesson_slug,
            started_at=now_ict(),
            completed_at=None,
            status=GameSessionStatus.IN_PROGRESS,
            question_sequence=question_sequence,
            gamification=gamification,
            question_limit=len(question_sequence),
        )
        created = await self._ps_repo.add(entity)
        return await self._hydration.to_session_out(created)
