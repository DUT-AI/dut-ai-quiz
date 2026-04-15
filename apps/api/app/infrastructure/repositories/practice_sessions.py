from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models import PracticeSession


class PracticeSessionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: UUID) -> PracticeSession | None:
        r = await self._s.execute(select(PracticeSession).where(PracticeSession.id == session_id))
        return r.scalar_one_or_none()

    async def list_for_user(self, user_id: int, limit: int = 50) -> list[PracticeSession]:
        r = await self._s.execute(
            select(PracticeSession)
            .where(PracticeSession.user_id == user_id)
            .order_by(PracticeSession.started_at.desc())
            .limit(limit)
        )
        return list(r.scalars().all())

    async def add(self, row: PracticeSession) -> PracticeSession:
        self._s.add(row)
        await self._s.flush()
        await self._s.refresh(row)
        return row

    async def save(self, row: PracticeSession) -> PracticeSession:
        await self._s.flush()
        await self._s.refresh(row)
        return row
