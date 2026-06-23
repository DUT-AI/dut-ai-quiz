from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.question import QuestionEntity
from app.infrastructure.persistence.models import PoolType, Question


class QuestionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, question_id: UUID) -> QuestionEntity | None:
        r = await self._s.execute(select(Question).where(Question.id == question_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_all(
        self,
        *,
        pool_type: PoolType | None = None,
        lesson_id: UUID | None = None,
        tag: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[QuestionEntity]:
        stmt = select(Question)
        if pool_type is not None:
            stmt = stmt.where(Question.pool_type == pool_type)
        if lesson_id:
            stmt = stmt.where(Question.lesson_id == lesson_id)
        if tag:
            stmt = stmt.where(func.array_position(Question.tags, tag).isnot(None))
        stmt = (
            stmt.offset(offset)
            .limit(limit)
            .order_by(Question.created_at.asc(), Question.id.asc())
        )
        r = await self._s.execute(stmt)
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: QuestionEntity) -> QuestionEntity:
        model = Question.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def add_bulk(self, entities: list[QuestionEntity]) -> list[QuestionEntity]:
        models = [Question.from_entity(e) for e in entities]
        self._s.add_all(models)
        await self._s.flush()
        return [m.to_entity() for m in models]

    async def update(self, entity: QuestionEntity) -> QuestionEntity:
        r = await self._s.execute(select(Question).where(Question.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.pool_type = entity.pool_type
            model.content = entity.content
            model.options = [opt.to_dict() for opt in entity.options]
            model.solution = entity.solution
            model.lesson_id = entity.lesson_id
            model.tags = entity.tags
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Question not found")

    async def delete(self, entity: QuestionEntity) -> None:
        r = await self._s.execute(select(Question).where(Question.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
