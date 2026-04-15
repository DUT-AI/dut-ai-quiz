from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models import FocusEvent


class FocusEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def exists(self, attempt_id: UUID, client_event_id: str) -> bool:
        r = await self._s.execute(
            select(FocusEvent.id).where(
                FocusEvent.attempt_id == attempt_id,
                FocusEvent.client_event_id == client_event_id,
            )
        )
        return r.scalar_one_or_none() is not None

    async def add(self, row: FocusEvent) -> FocusEvent:
        self._s.add(row)
        await self._s.flush()
        await self._s.refresh(row)
        return row
