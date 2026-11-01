from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.lesson_video import LessonVideoEntity
from app.domain.interfaces.lesson_video_repo import ILessonVideoRepository
from app.infrastructure.persistence.models.lesson_video import LessonVideo


class LessonVideoRepository(ILessonVideoRepository):
    """Repository implementation for LessonVideo database operations."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_by_lesson_id(self, lesson_id: UUID) -> list[LessonVideoEntity]:
        stmt = (
            select(LessonVideo)
            .where(LessonVideo.lesson_id == lesson_id)
            .order_by(LessonVideo.order.asc(), LessonVideo.created_at.asc())
        )
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def get(self, video_id: UUID) -> LessonVideoEntity | None:
        stmt = select(LessonVideo).where(LessonVideo.id == video_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def add(self, entity: LessonVideoEntity) -> LessonVideoEntity:
        m = LessonVideo.from_entity(entity)
        self._session.add(m)
        await self._session.flush()
        await self._session.refresh(m)
        return m.to_entity()

    async def replace_lesson_videos(
        self, lesson_id: UUID, new_videos: list[LessonVideoEntity]
    ) -> list[LessonVideoEntity]:
        # Delete existing videos for this lesson
        del_stmt = delete(LessonVideo).where(LessonVideo.lesson_id == lesson_id)
        await self._session.execute(del_stmt)

        # Insert new videos
        saved_entities: list[LessonVideoEntity] = []
        for v in new_videos:
            m = LessonVideo.from_entity(v)
            self._session.add(m)
            await self._session.flush()
            await self._session.refresh(m)
            saved_entities.append(m.to_entity())

        return saved_entities

    async def delete(self, video_id: UUID) -> bool:
        stmt = select(LessonVideo).where(LessonVideo.id == video_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        if not m:
            return False
        await self._session.delete(m)
        await self._session.flush()
        return True
