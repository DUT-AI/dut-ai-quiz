from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.dependency_request import DependencyRequestEntity
from app.domain.value_objects.enums import DependencyRequestStatus
from app.infrastructure.persistence.models import DependencyRequest


class DependencyRequestRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, request_id: UUID) -> DependencyRequestEntity | None:
        r = await self._s.execute(
            select(DependencyRequest).where(DependencyRequest.id == request_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_by_user(self, user_id: int) -> list[DependencyRequestEntity]:
        """List all requests created by a specific user."""
        r = await self._s.execute(
            select(DependencyRequest)
            .where(DependencyRequest.user_id == user_id)
            .order_by(DependencyRequest.created_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_by_hackathon(
        self, hackathon_id: UUID
    ) -> list[DependencyRequestEntity]:
        """List all requests for a specific hackathon."""
        r = await self._s.execute(
            select(DependencyRequest)
            .where(DependencyRequest.hackathon_id == hackathon_id)
            .order_by(DependencyRequest.created_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_pending(self) -> list[DependencyRequestEntity]:
        """List all pending requests for admin review."""
        r = await self._s.execute(
            select(DependencyRequest)
            .where(DependencyRequest.status == DependencyRequestStatus.PENDING)
            .order_by(DependencyRequest.created_at)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_all(self) -> list[DependencyRequestEntity]:
        """List all dependency requests (admin view)."""
        r = await self._s.execute(
            select(DependencyRequest).order_by(DependencyRequest.created_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: DependencyRequestEntity) -> DependencyRequestEntity:
        model = DependencyRequest.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: DependencyRequestEntity) -> DependencyRequestEntity:
        r = await self._s.execute(
            select(DependencyRequest).where(DependencyRequest.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if not model:
            raise ValueError(f"Dependency request {entity.id} not found")

        model.status = entity.status
        model.admin_note = entity.admin_note
        model.reviewed_at = entity.reviewed_at
        model.reviewed_by = entity.reviewed_by

        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def delete(self, entity: DependencyRequestEntity) -> None:
        r = await self._s.execute(
            select(DependencyRequest).where(DependencyRequest.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
