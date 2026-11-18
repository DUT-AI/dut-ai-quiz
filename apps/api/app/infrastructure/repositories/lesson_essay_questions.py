from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity
from app.domain.interfaces.lesson_essay_question_repo import (
    ILessonEssayQuestionRepository,
)
from app.infrastructure.persistence.models.lesson_essay_question import (
    LessonEssayQuestion,
)


class LessonEssayQuestionRepository(ILessonEssayQuestionRepository):
    """Repository implementation for LessonEssayQuestion database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_lesson_id(
        self, lesson_id: UUID
    ) -> list[LessonEssayQuestionEntity]:
        stmt = (
            select(LessonEssayQuestion)
            .where(LessonEssayQuestion.lesson_id == lesson_id)
            .order_by(
                LessonEssayQuestion.order.asc(),
                LessonEssayQuestion.created_at.asc(),
            )
        )
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def replace_lesson_essay_questions(
        self, lesson_id: UUID, items: list[LessonEssayQuestionEntity]
    ) -> list[LessonEssayQuestionEntity]:
        stmt = select(LessonEssayQuestion).where(
            LessonEssayQuestion.lesson_id == lesson_id
        )
        result = await self._session.execute(stmt)
        existing_by_id = {m.id: m for m in result.scalars().all()}

        incoming_ids: set[UUID] = set()
        now = now_ict()

        for item in items:
            if item.id in existing_by_id:
                model = existing_by_id[item.id]
                model.question_md = item.question_md
                model.answer_md = item.answer_md
                model.order = item.order
                model.updated_at = now
                incoming_ids.add(item.id)
            else:
                model = LessonEssayQuestion.from_entity(
                    LessonEssayQuestionEntity(
                        id=item.id,
                        lesson_id=lesson_id,
                        question_md=item.question_md,
                        answer_md=item.answer_md,
                        order=item.order,
                        created_at=item.created_at or now,
                        updated_at=now,
                    )
                )
                self._session.add(model)
                incoming_ids.add(model.id)

        for existing_id, model in existing_by_id.items():
            if existing_id not in incoming_ids:
                await self._session.delete(model)

        await self._session.flush()
        return await self.list_by_lesson_id(lesson_id)
