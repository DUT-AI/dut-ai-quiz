from typing import Protocol
from uuid import UUID, uuid4

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.infrastructure.persistence.models import Lesson


class LessonRepository(Protocol):
    async def list_all(self) -> list[LessonEntity]: ...
    async def get(self, lesson_id: UUID) -> LessonEntity | None: ...
    async def get_by_slug(self, slug: str) -> LessonEntity | None: ...
    async def add(self, entity: LessonEntity) -> LessonEntity: ...
    async def update(self, entity: LessonEntity) -> LessonEntity: ...
    async def delete(self, entity: LessonEntity) -> None: ...


class MockRepository(LessonRepository):
    async def list_all(self) -> list[LessonEntity]:
        return [
            LessonEntity(
                id=uuid4(),
                name="Topic 1",
                description="Topic 1 description",
                content_md="# Topic 1\n\nTopic 1 content.",
                order=1,
                slug=None,
                blog_id=None,
                created_at=now_ict(),
            )
        ]

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        return None


class SqlLessonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[LessonEntity]:
        stmt = select(Lesson).order_by(Lesson.order.asc(), Lesson.created_at.asc())
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        stmt = select(Lesson).where(Lesson.id == lesson_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        stmt = select(Lesson).where(Lesson.slug == slug)
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
            m.content_md = entity.content_md
            m.order = entity.order
            m.slug = entity.slug
            m.blog_id = entity.blog_id
            await self._session.flush()
            await self._session.refresh(m)
            return m.to_entity()
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        stmt = delete(Lesson).where(Lesson.id == entity.id)
        await self._session.execute(stmt)
        await self._session.flush()