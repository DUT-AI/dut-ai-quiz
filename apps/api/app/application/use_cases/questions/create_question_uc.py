from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.questions import (
    QuestionBulkCreate,
    QuestionCreate,
)


class CreateQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, payload: QuestionCreate) -> QuestionEntity:

        options = [
            QuestionOptionEntity(
                id=opt.id or str(uuid4()).split("-")[0],
                text=opt.text,
                is_correct=opt.is_correct,
                fixed=opt.fixed,
            )
            for opt in payload.options
        ]

        entity = QuestionEntity(
            id=uuid4(),
            lesson_id=payload.lesson_id,
            pool_type=payload.pool_type,
            content=payload.content,
            options=options,
            solution=payload.solution,
            tags=payload.tags,
            created_by=payload.created_by or 1,
            created_at=now_ict(),
        )
        return await self._question_repo.add(entity)


class BulkCreateQuestionsUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, payload: QuestionBulkCreate) -> list[QuestionEntity]:
        entities: list[QuestionEntity] = []
        created_at = now_ict()

        for item in payload.questions:
            # Generate IDs for options if they don't have them
            options: list[QuestionOptionEntity] = []
            for opt in item.options:
                options.append(
                    QuestionOptionEntity(
                        id=opt.id or str(uuid4()).split("-")[0],
                        text=opt.text,
                        is_correct=opt.is_correct,
                        fixed=opt.fixed,
                    )
                )

            entities.append(
                QuestionEntity(
                    id=uuid4(),
                    lesson_id=payload.lesson_id,
                    pool_type=payload.pool_type,
                    content=item.question,
                    options=options,
                    solution=item.solution,
                    tags=payload.tags,
                    created_by=payload.created_by or 1,
                    created_at=created_at,
                )
            )

        return await self._question_repo.add_bulk(entities)
