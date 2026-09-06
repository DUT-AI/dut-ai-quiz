import random
from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import (
    IGameSessionRepository,
    ILessonRepository,
    IQuestionRepository,
)
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache
from app.presentation.schemas.game import GamificationStartIn
from fastapi import HTTPException


class StartGameSessionUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        lesson_repo: ILessonRepository,
        cache: GameLeaderboardCache = None,
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._lesson_repo = lesson_repo
        self._cache = cache


    async def execute(
        self, user_id: int, payload: GamificationStartIn
    ) -> GameSessionEntity:
        # Auto-finish any existing IN_PROGRESS session for this lesson+user
        # so that the client never needs to call finishSession separately.
        existing = await self._ps_repo.get_active_by_lesson(user_id, payload.lesson_slug)
        if existing and existing.status == GameSessionStatus.IN_PROGRESS:
            existing.status = GameSessionStatus.COMPLETED
            existing.completed_at = now_ict()
            lesson_slug_for_decay = existing.snapshot.get("lesson_slug", payload.lesson_slug) if existing.snapshot else payload.lesson_slug
            count_completed = await self._ps_repo.count_completed_by_lesson(user_id, lesson_slug_for_decay)
            decay = max(0.2, 1.0 - (count_completed * 0.2))
            if existing.snapshot and "gamification" in existing.snapshot:
                base_points = existing.snapshot["gamification"].get("points", 0)
                existing.snapshot["gamification"]["final_score"] = base_points * decay
                existing.snapshot["gamification"]["attempt_count"] = count_completed + 1
            await self._ps_repo.save(existing)
            if self._cache:
                await self._cache.invalidate(lesson_slug_for_decay)

        # Find lesson by slug, id or name
        lessons = await self._lesson_repo.list_all()
        target_lesson_id = None
        for lesson in lessons:
            # Check UUID match, slug match, or name-slug match
            name_slug = lesson.name.lower().replace(" ", "-").replace("_", "-")
            if (
                str(lesson.id) == payload.lesson_slug
                or (lesson.slug and lesson.slug.lower() == payload.lesson_slug.lower())
                or name_slug == payload.lesson_slug.lower().replace(" ", "-").replace("_", "-")
            ):
                target_lesson_id = lesson.id
                break

        # We can still proceed even if target_lesson_id is None, it just won't filter by lesson.
        # But if the user provided a slug, we might want to restrict it or raise an error.
        # For safety, let's just use it to filter questions.

        questions = await self._question_repo.list_all(
            pool_type=PoolType.GAME,
            lesson_id=target_lesson_id,
            offset=0,
            limit=1000,
        )

        if not questions:
            raise HTTPException(
                status_code=400,
                detail="Bài học này chưa có câu hỏi luyện tập thi đấu nào dưới database."
            )

        # Check user's history to prioritize unseen questions
        history = await self._ps_repo.list_history(user_id)
        seen_question_ids = set()
        for session in history:
            if session.snapshot and "questions" in session.snapshot:
                for q in session.snapshot["questions"]:
                    if "id" in q:
                        seen_question_ids.add(q["id"])

        def prioritize_and_limit(q_list, limit):
            unseen = [q for q in q_list if str(q.id) not in seen_question_ids]
            seen = [q for q in q_list if str(q.id) in seen_question_ids]
            random.shuffle(unseen)
            random.shuffle(seen)
            return (unseen + seen)[:limit]

        # Select questions for each tier
        easy_qs = [q for q in questions if q.difficulty == Difficulty.EASY]
        med_qs = [q for q in questions if q.difficulty == Difficulty.MEDIUM]
        hard_qs = [q for q in questions if q.difficulty == Difficulty.HARD]

        tier1_qs = prioritize_and_limit(easy_qs, 10)
        tier2_qs = prioritize_and_limit(med_qs, 5)
        tier3_qs = prioritize_and_limit(hard_qs, 5)

        def clean_options(options):
            cleaned = []
            for opt in options:
                o_dict = opt.to_dict()
                o_dict.pop("is_correct", None)
                cleaned.append(o_dict)
            return cleaned

        selected_questions = []

        for i, q in enumerate(tier1_qs):
            is_boss = (i == len(tier1_qs) - 1) and len(tier1_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 30 if is_boss else 60,
                "time_response": 0,
                "tier": 1,
                "is_boss": is_boss,
            }
            selected_questions.append(q_dict)

        for i, q in enumerate(tier2_qs):
            is_boss = (i == len(tier2_qs) - 1) and len(tier2_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 60 if is_boss else 120,
                "time_response": 0,
                "tier": 2,
                "is_boss": is_boss,
            }
            selected_questions.append(q_dict)

        for i, q in enumerate(tier3_qs):
            is_boss = (i == len(tier3_qs) - 1) and len(tier3_qs) > 0
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": clean_options(q.options),
                "time_limit": 120 if is_boss else 300,
                "time_response": 0,
                "tier": 3,
                "is_boss": is_boss,
            }
            selected_questions.append(q_dict)

        snapshot = {
            "lesson_slug": payload.lesson_slug,
            "questions": selected_questions,
            "answers": {},
            "gamification": {
                "lives": 3,
                "gold": 0,
                "points": 0,
                "current_tier": 1,
                "last_question_index": 0,
                "boss_hp": 1
                if (selected_questions and selected_questions[0].get("is_boss", False))
                else 0,
                "shield_used_in_tier": {},
                "current_question_started_at": now_ict().isoformat(),
            },
        }

        entity = GameSessionEntity(
            id=uuid4(),
            user_id=user_id,
            started_at=now_ict(),
            completed_at=None,
            status=GameSessionStatus.IN_PROGRESS,
            snapshot=snapshot,
            tags_filter=[payload.lesson_slug],
            question_limit=len(selected_questions),
        )
        return await self._ps_repo.add(entity)
