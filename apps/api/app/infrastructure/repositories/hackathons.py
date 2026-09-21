import hashlib
from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.hackathon import (
    HackathonEntity,
    HackathonRegistrationEntity,
    HackathonTaskEntity,
    HackathonTeamEntity,
    RegistrationStatus,
)
from app.domain.entities.submission import (
    HackathonSubmissionEntity,
    SubmissionStatus,
)
from app.domain.interfaces.hackathon_repo import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
)
from app.infrastructure.persistence.models import (
    Hackathon,
    HackathonRegistration,
    HackathonSubmission,
    HackathonTask,
    HackathonTeam,
)


class HackathonRepository(IHackathonRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, hackathon_id: UUID) -> HackathonEntity | None:
        r = await self._s.execute(select(Hackathon).where(Hackathon.id == hackathon_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_admin(self, user_id: int) -> list[HackathonEntity]:
        r = await self._s.execute(
            select(Hackathon)
            .where(Hackathon.created_by == user_id)
            .order_by(Hackathon.name)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_all(self) -> list[HackathonEntity]:
        r = await self._s.execute(select(Hackathon).order_by(Hackathon.name))
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


class HackathonTaskRepository(IHackathonTaskRepository):
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
        r = await self._s.execute(
            select(HackathonTask).where(HackathonTask.id == task_id)
        )
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
        r = await self._s.execute(
            select(HackathonTask).where(HackathonTask.id == entity.id)
        )
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
        r = await self._s.execute(
            select(HackathonTask).where(HackathonTask.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)


class HackathonTeamRepository(IHackathonTeamRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, team_id: UUID) -> HackathonTeamEntity | None:
        r = await self._s.execute(
            select(HackathonTeam).where(HackathonTeam.id == team_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def get_by_code(self, code: str) -> HackathonTeamEntity | None:
        r = await self._s.execute(
            select(HackathonTeam).where(HackathonTeam.code == code)
        )
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

    async def get_user_team(
        self, hackathon_id: UUID, user_id: int
    ) -> HackathonTeamEntity | None:
        r = await self._s.execute(
            select(HackathonTeam).where(
                HackathonTeam.hackathon_id == hackathon_id,
                HackathonTeam.member_ids.any(user_id),
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
        r = await self._s.execute(
            select(HackathonTeam).where(HackathonTeam.id == entity.id)
        )
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
        r = await self._s.execute(
            select(HackathonTeam).where(HackathonTeam.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)


class HackathonRegistrationRepository(IHackathonRegistrationRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, registration_id: UUID) -> HackathonRegistrationEntity | None:
        r = await self._s.execute(
            select(HackathonRegistration).where(
                HackathonRegistration.id == registration_id
            )
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
                HackathonRegistration.status != RegistrationStatus.CANCELLED,
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
                HackathonRegistration.status != RegistrationStatus.CANCELLED,
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


class HackathonSubmissionRepository(IHackathonSubmissionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, submission_id: UUID) -> HackathonSubmissionEntity | None:
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(HackathonSubmission.id == submission_id)
            .execution_options(populate_existing=True)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def add(self, entity: HackathonSubmissionEntity) -> HackathonSubmissionEntity:
        model = HackathonSubmission.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(
        self, entity: HackathonSubmissionEntity
    ) -> HackathonSubmissionEntity:
        r = await self._s.execute(
            select(HackathonSubmission).where(HackathonSubmission.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            model.status = entity.status
            model.public_score = entity.public_score
            model.private_score = entity.private_score
            model.inference_time = entity.inference_time
            model.error_message = entity.error_message
            model.logs = entity.logs
            model.updated_at = entity.updated_at
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Submission not found")

    async def list_for_task(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> list[HackathonSubmissionEntity]:
        stmt = select(HackathonSubmission).where(HackathonSubmission.task_id == task_id)
        if team_id:
            stmt = stmt.where(HackathonSubmission.team_id == team_id)
        elif user_id:
            stmt = stmt.where(
                HackathonSubmission.user_id == user_id,
                HackathonSubmission.team_id == None,
            )
        stmt = stmt.order_by(HackathonSubmission.created_at.desc())
        r = await self._s.execute(stmt)
        return [m.to_entity() for m in r.scalars().all()]

    async def count_submissions(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> int:
        counted_statuses = (
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.RUNNING,
            SubmissionStatus.EVALUATING,
            SubmissionStatus.PUBLISHED,
        )
        stmt = select(func.count(HackathonSubmission.id)).where(
            HackathonSubmission.task_id == task_id,
            HackathonSubmission.status.in_(counted_statuses),
        )
        if team_id:
            stmt = stmt.where(HackathonSubmission.team_id == team_id)
        elif user_id:
            stmt = stmt.where(
                HackathonSubmission.user_id == user_id,
                HackathonSubmission.team_id == None,
            )

        r = await self._s.execute(stmt)
        return r.scalar() or 0

    async def acquire_quota_lock(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> None:
        participant = f"team:{team_id}" if team_id else f"user:{user_id}"
        digest = hashlib.sha256(f"{task_id}:{participant}".encode()).digest()
        lock_id = int.from_bytes(digest[:8], "big", signed=False) % (2**63 - 1)
        await self._s.execute(select(func.pg_advisory_xact_lock(lock_id)))

    async def commit(self) -> None:
        await self._s.commit()

    async def get_last_submission(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> HackathonSubmissionEntity | None:
        stmt = select(HackathonSubmission).where(HackathonSubmission.task_id == task_id)
        if team_id:
            stmt = stmt.where(HackathonSubmission.team_id == team_id)
        elif user_id:
            stmt = stmt.where(
                HackathonSubmission.user_id == user_id,
                HackathonSubmission.team_id == None,
            )
        stmt = stmt.order_by(HackathonSubmission.created_at.desc()).limit(1)
        r = await self._s.execute(stmt)
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_hackathon(
        self, hackathon_id: UUID
    ) -> list[HackathonSubmissionEntity]:
        from app.infrastructure.persistence.models.hackathon import HackathonTask

        stmt = (
            select(HackathonSubmission)
            .join(HackathonTask, HackathonSubmission.task_id == HackathonTask.id)
            .where(HackathonTask.hackathon_id == hackathon_id)
        )
        r = await self._s.execute(stmt)
        return [m.to_entity() for m in r.scalars().all()]
