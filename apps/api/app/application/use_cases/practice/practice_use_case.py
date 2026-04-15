import random
from datetime import datetime
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.practice import PracticeSessionEntity
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.persistence.models import PoolType, PracticeSessionStatus
from app.presentation.schemas.exams import PracticeStartIn
from app.presentation.schemas.attempts import AttemptAnswersPatch


class StartPracticeSessionUseCase:
    def __init__(self, ps_repo: PracticeSessionRepository, question_repo: QuestionRepository):
        self._ps_repo = ps_repo
        self._question_repo = question_repo

    async def execute(self, user_id: int, payload: PracticeStartIn) -> PracticeSessionEntity:
        # Get questions from practice pool
        questions = await self._question_repo.list_all(
            pool_type=PoolType.PRACTICE,
            difficulty=payload.difficulty,
            offset=0,
            limit=500, # Large enough to sample from
        )
        
        # Filter by tags if provided in payload
        if payload.tags:
            questions = [q for q in questions if any(tag in q.tags for tag in payload.tags)]
            
        random.shuffle(questions)
        selected = questions[: payload.limit]
        
        snapshot = {
            "questions": [
                {
                    "id": str(q.id),
                    "content": q.content,
                    "options": q.options,
                    "solution": q.solution,
                }
                for q in selected
            ],
            "answers": {},
        }
        
        entity = PracticeSessionEntity(
            id=uuid4(),
            user_id=user_id,
            started_at=now_ict(),
            completed_at=None,
            status=PracticeSessionStatus.IN_PROGRESS,
            snapshot=snapshot,
            tags_filter=payload.tags or [],
            difficulty_filter=payload.difficulty,
            question_limit=payload.limit,
        )
        return await self._ps_repo.add(entity)


class GetPracticeSessionUseCase:
    def __init__(self, ps_repo: PracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, session_id: UUID, user_id: int) -> PracticeSessionEntity | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None
        return session


class PatchPracticeAnswersUseCase:
    def __init__(self, ps_repo: PracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, session_id: UUID, user_id: int, payload: AttemptAnswersPatch) -> bool:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return False
            
        if session.status != PracticeSessionStatus.IN_PROGRESS:
            return False
            
        if session.snapshot is None:
            session.snapshot = {"questions": [], "answers": {}}
        elif "answers" not in session.snapshot:
            session.snapshot["answers"] = {}
            
        for a in payload.answers:
            session.snapshot["answers"][str(a.question_id)] = a.selected_option_id
            
        await self._ps_repo.save(session)
        return True


class FinishPracticeSessionUseCase:
    def __init__(self, ps_repo: PracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, session_id: UUID, user_id: int) -> PracticeSessionEntity | None:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            return None
            
        if session.status == PracticeSessionStatus.COMPLETED:
            return session
            
        session.status = PracticeSessionStatus.COMPLETED
        session.completed_at = now_ict()
        return await self._ps_repo.save(session)


class ListPracticeHistoryUseCase:
    def __init__(self, ps_repo: PracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int) -> list[PracticeSessionEntity]:
        return await self._ps_repo.list_history(user_id)
