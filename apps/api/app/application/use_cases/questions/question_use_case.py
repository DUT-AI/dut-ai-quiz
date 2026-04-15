from datetime import datetime
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.question import QuestionEntity
from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.questions import QuestionCreate, QuestionUpdate, QuestionListQuery


class CreateQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, payload: QuestionCreate) -> QuestionEntity:
        entity = QuestionEntity(
            id=uuid4(),
            pool_type=payload.pool_type,
            content=payload.content,
            options=payload.options,
            solution=payload.solution,
            difficulty=payload.difficulty,
            tags=payload.tags,
            created_at=now_ict()
        )
        return await self._question_repo.add(entity)


class GetQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID) -> QuestionEntity | None:
        return await self._question_repo.get(question_id)


class ListQuestionsUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, query: QuestionListQuery) -> list[QuestionEntity]:
        return await self._question_repo.list_all(
            pool_type=query.pool_type,
            difficulty=query.difficulty,
            tag=query.tag,
            offset=query.offset,
            limit=query.limit,
        )


class UpdateQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID, payload: QuestionUpdate) -> QuestionEntity | None:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return None
        
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(entity, k, v)
            
        return await self._question_repo.update(entity)


class DeleteQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID) -> bool:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return False
        
        await self._question_repo.delete(entity)
        return True
