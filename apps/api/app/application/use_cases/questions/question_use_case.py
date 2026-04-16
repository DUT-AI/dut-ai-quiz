from datetime import datetime
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.question import QuestionEntity
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.repositories.attempts import AttemptRepository
from app.presentation.schemas.questions import (
    QuestionCreate,
    QuestionUpdate,
    QuestionListQuery,
    QuestionBulkCreate,
)

from app.application.use_cases.attempts.rescore_use_case import RescoreAttemptUseCase


class CreateQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, payload: QuestionCreate) -> QuestionEntity:
        entity = QuestionEntity(
            id=uuid4(),
            lesson_id=payload.lesson_id,
            pool_type=payload.pool_type,
            content=payload.content,
            options=payload.options,
            solution=payload.solution,
            tags=payload.tags,
            created_at=now_ict(),
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
            lesson_id=query.lesson_id,
            tag=query.tag,
            offset=query.offset,
            limit=query.limit,
        )


class UpdateQuestionUseCase:
    def __init__(
        self, 
        question_repo: QuestionRepository,
        att_repo: AttemptRepository,
        rescore_use_case: RescoreAttemptUseCase,
    ):
        self._question_repo = question_repo
        self._att_repo = att_repo
        self._rescore_use_case = rescore_use_case

    async def execute(
        self, question_id: UUID, payload: QuestionUpdate
    ) -> QuestionEntity | None:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return None

        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(entity, k, v)

        updated = await self._question_repo.update(entity)
        if updated:
            # Trigger re-scoring for all affected attempts
            attempt_ids = await self._att_repo.list_completed_ids_by_question_id(question_id)
            if attempt_ids:
                for aid in attempt_ids:
                    await self._rescore_use_case.execute(aid)
        
        return updated


class DeleteQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID) -> bool:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return False

        await self._question_repo.delete(entity)
        return True


class BulkCreateQuestionsUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, payload: QuestionBulkCreate) -> list[QuestionEntity]:
        entities = []
        created_at = now_ict()
        for item in payload.questions:
            # Generate IDs for options if they don't have them
            options = []
            for opt in item.options:
                options.append({
                    "id": opt.get("id") or str(uuid4()).split("-")[0],
                    "text": opt.get("text", ""),
                    "is_correct": opt.get("is_correct", False),
                })
            
            entities.append(QuestionEntity(
                id=uuid4(),
                lesson_id=payload.lesson_id,
                pool_type=payload.pool_type,
                content=item.question,
                options=options,
                solution=item.solution,
                tags=payload.tags,
                created_at=created_at,
            ))
        
        return await self._question_repo.add_bulk(entities)
