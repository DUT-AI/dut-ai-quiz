
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.attempt import FocusEventEntity
from app.infrastructure.persistence.models import FocusEvent

class FocusEventRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def add(self, entity: FocusEventEntity) -> FocusEventEntity:
        model = FocusEvent.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def exists_for_client_event(self, client_event_id: str) -> bool:
        r = await self._s.execute(select(FocusEvent).where(FocusEvent.client_event_id == client_event_id))
        return r.scalar_one_or_none() is not None
