from typing import Protocol
from uuid import UUID
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession
from app.domain.entities.lesson import LessonEntity
from app.infrastructure.persistence.models import Lesson

class LessonRepository(Protocol):
    async def list_all(self) -> list[LessonEntity]: ...
    async def get(self, lesson_id: UUID) -> LessonEntity | None: ...
    async def add(self, entity: LessonEntity) -> LessonEntity: ...
    async def update(self, entity: LessonEntity) -> LessonEntity: ...
    async def delete(self, entity: LessonEntity) -> None: ...

class SqlLessonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[LessonEntity]:
        stmt = select(Lesson).order_by(Lesson.order)
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def add(self, entity: LessonEntity) -> LessonEntity:
        m = Lesson.from_entity(entity)
        self._session.add(m)
        await self._session.flush()
        await self._session.refresh(m)
        return m.to_entity()

    async def update(self, entity: LessonEntity) -> LessonEntity:
        stmt = select(Lesson).where(Lesson.id == entity.id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        if m:
            m.name = entity.name
            m.description = entity.description
            m.order = entity.order
            await self._session.flush()
            await self._session.refresh(m)
            return m.to_entity()
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        stmt = delete(Lesson).where(Lesson.id == entity.id)
        await self._session.execute(stmt)
        await self._session.flush()
