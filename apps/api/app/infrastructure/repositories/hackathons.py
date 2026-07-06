from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.hackathon import (
    HackathonEntity,
    HackathonTaskEntity,
    HackathonTeamEntity,
    HackathonRegistrationEntity,
    RegistrationStatus,
)
from app.infrastructure.persistence.models import (
    Hackathon,
    HackathonTask,
    HackathonTeam,
    HackathonRegistration,
)


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

    async def list_all(self) -> list[HackathonEntity]:
        r = await self._s.execute(
            select(Hackathon).order_by(Hackathon.name)
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


class HackathonTaskRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def exists_name(self, hackathon_id: UUID, name: str) -> bool:
        r = await self._s.execute(
            select(HackathonTask).where(
                HackathonTask.hackathon_id == hackathon_id,
                HackathonTask.name == name,
            )
        )
        return r.scalar_one_or_none() is not None
    async def get(self, task_id: UUID) -> HackathonTaskEntity | None:
        r = await self._s.execute(select(HackathonTask).where(HackathonTask.id == task_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_hackathon(self, hackathon_id: UUID) -> list[HackathonTaskEntity]:
        r = await self._s.execute(
            select(HackathonTask)
            .where(HackathonTask.hackathon_id == hackathon_id)
            .order_by(HackathonTask.created_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: HackathonTaskEntity) -> HackathonTaskEntity:
        model = HackathonTask.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: HackathonTaskEntity) -> HackathonTaskEntity:
        r = await self._s.execute(select(HackathonTask).where(HackathonTask.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.name = entity.name
            model.problem_description_md = entity.problem_description_md
            model.private_test_url = entity.private_test_url
            model.public_test_url = entity.public_test_url
            model.metric_type = entity.metric_type
            model.max_submissions = entity.max_submissions
            model.updated_at = entity.updated_at
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Hackathon task not found")

    async def delete(self, entity: HackathonTaskEntity) -> None:
        r = await self._s.execute(select(HackathonTask).where(HackathonTask.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)


class HackathonTeamRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, team_id: UUID) -> HackathonTeamEntity | None:
        r = await self._s.execute(select(HackathonTeam).where(HackathonTeam.id == team_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_by_code(self, code: str) -> HackathonTeamEntity | None:
        r = await self._s.execute(select(HackathonTeam).where(HackathonTeam.code == code))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def exists_name(self, hackathon_id: UUID, name: str) -> bool:
        r = await self._s.execute(
            select(HackathonTeam).where(
                HackathonTeam.hackathon_id == hackathon_id,
                HackathonTeam.name == name,
            )
        )
        return r.scalar_one_or_none() is not None

    async def get_user_team(self, hackathon_id: UUID, user_id: int) -> HackathonTeamEntity | None:
        r = await self._s.execute(
            select(HackathonTeam).where(
                HackathonTeam.hackathon_id == hackathon_id,
                HackathonTeam.member_ids.any(user_id)
            )
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def add(self, entity: HackathonTeamEntity) -> HackathonTeamEntity:
        model = HackathonTeam.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: HackathonTeamEntity) -> HackathonTeamEntity:
        r = await self._s.execute(select(HackathonTeam).where(HackathonTeam.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.name = entity.name
            model.code = entity.code
            model.leader_id = entity.leader_id
            model.member_ids = entity.member_ids
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Team not found")

    async def delete(self, entity: HackathonTeamEntity) -> None:
        r = await self._s.execute(select(HackathonTeam).where(HackathonTeam.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)


class HackathonRegistrationRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, registration_id: UUID) -> HackathonRegistrationEntity | None:
        r = await self._s.execute(
            select(HackathonRegistration).where(HackathonRegistration.id == registration_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_user_registration(
        self, hackathon_id: UUID, user_id: int
    ) -> HackathonRegistrationEntity | None:
        r = await self._s.execute(
            select(HackathonRegistration).where(
                HackathonRegistration.hackathon_id == hackathon_id,
                HackathonRegistration.user_id == user_id,
                HackathonRegistration.status != RegistrationStatus.CANCELLED
            )
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_team_registration(
        self, hackathon_id: UUID, team_id: UUID
    ) -> HackathonRegistrationEntity | None:
        r = await self._s.execute(
            select(HackathonRegistration).where(
                HackathonRegistration.hackathon_id == hackathon_id,
                HackathonRegistration.team_id == team_id,
                HackathonRegistration.status != RegistrationStatus.CANCELLED
            )
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_hackathon(
        self, hackathon_id: UUID
    ) -> list[HackathonRegistrationEntity]:
        r = await self._s.execute(
            select(HackathonRegistration)
            .where(HackathonRegistration.hackathon_id == hackathon_id)
            .order_by(HackathonRegistration.registered_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        model = HackathonRegistration.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        r = await self._s.execute(
            select(HackathonRegistration).where(HackathonRegistration.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            model.status = entity.status
            model.reviewed_by = entity.reviewed_by
            model.rejection_reason = entity.rejection_reason
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Registration not found")

    async def update_full(
        self, entity: HackathonRegistrationEntity
    ) -> HackathonRegistrationEntity:
        """Update tất cả các trường — dùng khi đăng ký lại sau khi bị từ chối."""
        r = await self._s.execute(
            select(HackathonRegistration).where(HackathonRegistration.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            model.status = entity.status
            model.reviewed_by = entity.reviewed_by
            model.rejection_reason = entity.rejection_reason
            model.registered_at = entity.registered_at
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Registration not found")

    async def delete(self, entity: HackathonRegistrationEntity) -> None:
        r = await self._s.execute(
            select(HackathonRegistration).where(HackathonRegistration.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
            
