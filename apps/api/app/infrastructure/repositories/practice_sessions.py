from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import IPracticeSessionRepository
from app.infrastructure.persistence.models import PracticeSession

class PracticeSessionRepository(IPracticeSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: UUID) -> PracticeSessionEntity | None:
        r = await self._s.execute(select(PracticeSession).where(PracticeSession.id == session_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_history(self, user_id: int) -> list[PracticeSessionEntity]:
        r = await self._s.execute(
            select(PracticeSession)
            .where(PracticeSession.user_id == user_id)
            .order_by(PracticeSession.started_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        model = PracticeSession.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def save(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        r = await self._s.execute(select(PracticeSession).where(PracticeSession.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.completed_at = entity.completed_at
            model.status = entity.status
            model.snapshot = entity.snapshot
            model.tags_filter = entity.tags_filter
            model.question_limit = entity.question_limit
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Practice session not found")

    async def get_active_by_lesson(self, user_id: int, lesson_slug: str) -> PracticeSessionEntity | None:
        from app.domain.value_objects import PracticeSessionStatus
        r = await self._s.execute(
            select(PracticeSession)
            .where(PracticeSession.user_id == user_id)
            .where(PracticeSession.status == PracticeSessionStatus.IN_PROGRESS)
            .where(PracticeSession.tags_filter.contains([lesson_slug]))
            .order_by(PracticeSession.started_at.desc())
            .limit(1)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

