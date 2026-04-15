from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models import Difficulty, PoolType, Question


class QuestionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, question_id: UUID) -> Question | None:
        r = await self._s.execute(select(Question).where(Question.id == question_id))
        return r.scalar_one_or_none()

    async def list_all(
        self,
        *,
        pool_type: PoolType | None = None,
        difficulty: Difficulty | None = None,
        tag: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[Question]:
        stmt = select(Question)
        if pool_type is not None:
            stmt = stmt.where(Question.pool_type == pool_type)
        if difficulty is not None:
            stmt = stmt.where(Question.difficulty == difficulty)
        if tag:
            stmt = stmt.where(func.array_position(Question.tags, tag).isnot(None))
        stmt = stmt.offset(offset).limit(limit).order_by(Question.created_at.desc())
        r = await self._s.execute(stmt)
        return list(r.scalars().all())

    async def add(self, question: Question) -> Question:
        self._s.add(question)
        await self._s.flush()
        await self._s.refresh(question)
        return question

    async def delete(self, question: Question) -> None:
        await self._s.delete(question)
