from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.runtime_profile import RuntimeProfileEntity
from app.infrastructure.persistence.models import RuntimeProfile


class RuntimeProfileRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, profile_id: UUID) -> RuntimeProfileEntity | None:
        r = await self._s.execute(
            select(RuntimeProfile).where(RuntimeProfile.id == profile_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_by_name(self, name: str) -> RuntimeProfileEntity | None:
        r = await self._s.execute(
            select(RuntimeProfile).where(RuntimeProfile.name == name)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_active(self) -> list[RuntimeProfileEntity]:
        """List all active runtime profiles for users to choose from."""
        r = await self._s.execute(
            select(RuntimeProfile)
            .where(RuntimeProfile.is_active == True)
            .order_by(RuntimeProfile.display_name)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_all(self) -> list[RuntimeProfileEntity]:
        """List all runtime profiles (admin view)."""
        r = await self._s.execute(
            select(RuntimeProfile).order_by(RuntimeProfile.created_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: RuntimeProfileEntity) -> RuntimeProfileEntity:
        model = RuntimeProfile.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: RuntimeProfileEntity) -> RuntimeProfileEntity:
        r = await self._s.execute(
            select(RuntimeProfile).where(RuntimeProfile.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if not model:
            raise ValueError(f"Runtime profile {entity.id} not found")

        # Update all fields
        model.name = entity.name
        model.display_name = entity.display_name
        model.description = entity.description
        model.docker_image = entity.docker_image
        model.docker_image_tag = entity.docker_image_tag
        model.python_version = entity.python_version
        model.cuda_version = entity.cuda_version
        model.allowed_packages_json = entity.allowed_packages_json
        model.cpu_limit = entity.cpu_limit
        model.memory_limit_mb = entity.memory_limit_mb
        model.gpu_enabled = entity.gpu_enabled
        model.gpu_limit = entity.gpu_limit
        model.timeout_seconds = entity.timeout_seconds
        model.pids_limit = entity.pids_limit
        model.is_active = entity.is_active
        model.updated_at = entity.updated_at

        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def delete(self, entity: RuntimeProfileEntity) -> None:
        r = await self._s.execute(
            select(RuntimeProfile).where(RuntimeProfile.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)

    async def exists_name(self, name: str, exclude_id: UUID | None = None) -> bool:
        """Check if a profile with this name already exists."""
        stmt = select(RuntimeProfile).where(RuntimeProfile.name == name)
        if exclude_id:
            stmt = stmt.where(RuntimeProfile.id != exclude_id)
        r = await self._s.execute(stmt)
        return r.scalar_one_or_none() is not None
