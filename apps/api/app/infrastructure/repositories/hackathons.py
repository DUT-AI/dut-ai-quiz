from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.hackathon import HackathonEntity
from app.infrastructure.persistence.models import Hackathon


class HackathonRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, hackathon_id: UUID) -> HackathonEntity | None:
        r = await self._s.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_admin(self, user_id: int) -> list[HackathonEntity]:
        r = await self._s.execute(
            select(Hackathon).where(Hackathon.created_by == user_id).order_by(Hackathon.name)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: HackathonEntity) -> HackathonEntity:
        model = Hackathon.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: HackathonEntity) -> HackathonEntity:
        r = await self._s.execute(select(Hackathon).where(Hackathon.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.name = entity.name
            model.description = entity.description
            model.rules = entity.rules
            model.start_time = entity.start_time
            model.end_time = entity.end_time
            model.participation_mode = entity.participation_mode
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Hackathon not found")

    async def delete(self, entity: HackathonEntity) -> None:
        r = await self._s.execute(select(Hackathon).where(Hackathon.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
            
