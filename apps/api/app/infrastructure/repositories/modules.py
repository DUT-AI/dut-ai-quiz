from uuid import UUID

from sqlalchemy import delete, select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.module import ModuleEntity
from app.domain.interfaces.module_repo import IModuleRepository
from app.infrastructure.persistence.models.module import Module


class ModuleRepository(IModuleRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_all(self) -> list[ModuleEntity]:
        stmt = select(Module).order_by(Module.order.asc(), Module.created_at.asc())
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def get(self, module_id: UUID) -> ModuleEntity | None:
        stmt = select(Module).where(Module.id == module_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def get_by_name(self, name: str) -> ModuleEntity | None:
        stmt = select(Module).where(func.lower(Module.name) == func.lower(name))
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def search_by_name_prefix(self, prefix: str) -> list[ModuleEntity]:
        stmt = select(Module).where(func.lower(Module.name).startswith(func.lower(prefix)))
        result = await self._session.execute(stmt)
        return [m.to_entity() for m in result.scalars().all()]

    async def add(self, entity: ModuleEntity) -> ModuleEntity:
        m = Module.from_entity(entity)
        self._session.add(m)
        await self._session.flush()
        await self._session.refresh(m)
        return m.to_entity()

    async def update(self, entity: ModuleEntity) -> ModuleEntity:
        stmt = select(Module).where(Module.id == entity.id)
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

    async def delete(self, entity: ModuleEntity) -> None:
        stmt = delete(Module).where(Module.id == entity.id)
        await self._session.execute(stmt)
        await self._session.flush()
