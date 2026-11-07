from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.attempt import FocusEventEntity
from app.domain.interfaces import IFocusEventRepository
from app.infrastructure.persistence.models import FocusEvent


class FocusEventRepository(IFocusEventRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def add(self, entity: FocusEventEntity) -> FocusEventEntity:
        model = FocusEvent.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def exists_for_client_event(self, client_event_id: str) -> bool:
        r = await self._s.execute(
            select(FocusEvent).where(FocusEvent.client_event_id == client_event_id)
        )
        return r.scalar_one_or_none() is not None

    async def list_for_attempt(self, attempt_id) -> list[FocusEventEntity]:
        r = await self._s.execute(
            select(FocusEvent)
            .where(FocusEvent.attempt_id == attempt_id)
            .order_by(FocusEvent.received_at.asc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def delete(self, event_id) -> bool:
        r = await self._s.execute(delete(FocusEvent).where(FocusEvent.id == event_id))
        await self._s.flush()
        return (r.rowcount or 0) > 0

    async def delete_for_attempt(self, attempt_id) -> int:
        r = await self._s.execute(
            delete(FocusEvent).where(FocusEvent.attempt_id == attempt_id)
        )
        await self._s.flush()
        return r.rowcount or 0
