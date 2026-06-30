import random
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.practice import PracticeSessionEntity
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.persistence.models import PoolType, PracticeSessionStatus
from app.presentation.schemas.practice import GamificationStartIn


class StartGamificationSessionUseCase:
    def __init__(
        self, 
        ps_repo: PracticeSessionRepository, 
        question_repo: QuestionRepository,
        lesson_repo: LessonRepository
    ):
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._lesson_repo = lesson_repo

    async def execute(self, user_id: int, payload: GamificationStartIn) -> PracticeSessionEntity:
        # Find lesson by slug (name)
        lessons = await self._lesson_repo.list_all()
        target_lesson_id = None
        for lesson in lessons:
            # Simple slug comparison
            slug = lesson.name.lower().replace(" ", "-").replace("_", "-")
            if slug == payload.lesson_slug.lower().replace(" ", "-").replace("_", "-"):
                target_lesson_id = lesson.id
                break
        
        # We can still proceed even if target_lesson_id is None, it just won't filter by lesson.
        # But if the user provided a slug, we might want to restrict it or raise an error.
        # For safety, let's just use it to filter questions.
        
        questions = await self._question_repo.list_all(
            pool_type=PoolType.PRACTICE,
            lesson_id=target_lesson_id,
            offset=0,
            limit=1000,
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

        # Import Difficulty if not imported at the top, or just use string matching, but it's better to use the model
        from app.infrastructure.persistence.models import Difficulty
        
        easy_qs = [q for q in questions if q.difficulty == Difficulty.EASY]
        med_qs = [q for q in questions if q.difficulty == Difficulty.MEDIUM]
        hard_qs = [q for q in questions if q.difficulty == Difficulty.HARD]
        
        tier1_qs = prioritize_and_limit(easy_qs, 10)
        tier2_qs = prioritize_and_limit(med_qs, 5)
        tier3_qs = prioritize_and_limit(hard_qs, 5)
        
        selected_questions = []
        
        for q in tier1_qs:
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": [opt.to_dict() for opt in q.options],
                # Không lấy solution theo yêu cầu
                "time_limit": 60,
                "time_response": 0,
                "tier": 1
            }
            selected_questions.append(q_dict)

        for q in tier2_qs:
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": [opt.to_dict() for opt in q.options],
                "time_limit": 120,
                "time_response": 0,
                "tier": 2
            }
            selected_questions.append(q_dict)

        for q in tier3_qs:
            q_dict = {
                "id": str(q.id),
                "content": q.content,
                "options": [opt.to_dict() for opt in q.options],
                "time_limit": 300,
                "time_response": 0,
                "tier": 3
            }
            selected_questions.append(q_dict)
                
        snapshot = {
            "questions": selected_questions,
            "answers": {},
            "gamification": {
                "lives": 3,
                "gold": 0,
                "current_tier": 1
            }
        }
        
        entity = PracticeSessionEntity(
            id=uuid4(),
            user_id=user_id,
            started_at=now_ict(),
            completed_at=None,
            status=PracticeSessionStatus.IN_PROGRESS,
            snapshot=snapshot,
            tags_filter=[],
            question_limit=len(selected_questions),
        )
        return await self._ps_repo.add(entity)
