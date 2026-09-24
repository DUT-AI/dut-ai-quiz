from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.tag import TagEntity
from app.domain.interfaces.tag_repo import ITagRepository
from app.infrastructure.persistence.models.tag import Tag


class TagRepository(ITagRepository):
    """SQLAlchemy implementation of ITagRepository."""

    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, tag_id: UUID) -> TagEntity | None:
        r = await self._s.execute(select(Tag).where(Tag.id == tag_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_by_name(self, name: str) -> TagEntity | None:
        r = await self._s.execute(select(Tag).where(Tag.name == name))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_all(self) -> list[TagEntity]:
        r = await self._s.execute(select(Tag).order_by(Tag.name.asc()))
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: TagEntity) -> TagEntity:
        model = Tag.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def delete(self, tag_id: UUID) -> None:
        r = await self._s.execute(select(Tag).where(Tag.id == tag_id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
