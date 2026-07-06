from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.submission import HackathonSubmissionEntity
from app.domain.value_objects.enums import SubmissionStatus
from app.infrastructure.persistence.models import HackathonSubmission


class HackathonSubmissionRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, submission_id: UUID) -> HackathonSubmissionEntity | None:
        r = await self._s.execute(
            select(HackathonSubmission).where(HackathonSubmission.id == submission_id)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_by_task(self, task_id: UUID) -> list[HackathonSubmissionEntity]:
        """List all submissions for a specific task."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(HackathonSubmission.task_id == task_id)
            .order_by(HackathonSubmission.submitted_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_by_user(
        self, task_id: UUID, user_id: int
    ) -> list[HackathonSubmissionEntity]:
        """List all submissions by a specific user for a task."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(
                HackathonSubmission.task_id == task_id,
                HackathonSubmission.user_id == user_id,
            )
            .order_by(HackathonSubmission.submitted_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_by_team(
        self, task_id: UUID, team_id: UUID
    ) -> list[HackathonSubmissionEntity]:
        """List all submissions by a specific team for a task."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(
                HackathonSubmission.task_id == task_id,
                HackathonSubmission.team_id == team_id,
            )
            .order_by(HackathonSubmission.submitted_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def count_by_user(self, task_id: UUID, user_id: int) -> int:
        """Count submissions by user for max_submissions validation."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(
                HackathonSubmission.task_id == task_id,
                HackathonSubmission.user_id == user_id,
            )
        )
        return len(r.scalars().all())

    async def count_by_team(self, task_id: UUID, team_id: UUID) -> int:
        """Count submissions by team for max_submissions validation."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(
                HackathonSubmission.task_id == task_id,
                HackathonSubmission.team_id == team_id,
            )
        )
        return len(r.scalars().all())

    async def get_best_submission(
        self, task_id: UUID, user_id: int | None = None, team_id: UUID | None = None
    ) -> HackathonSubmissionEntity | None:
        """Get the best (highest score) submission for leaderboard."""
        stmt = select(HackathonSubmission).where(
            HackathonSubmission.task_id == task_id,
            HackathonSubmission.status == SubmissionStatus.COMPLETED,
        )

        if user_id:
            stmt = stmt.where(HackathonSubmission.user_id == user_id)
        if team_id:
            stmt = stmt.where(HackathonSubmission.team_id == team_id)

        stmt = stmt.order_by(HackathonSubmission.score.desc()).limit(1)

        r = await self._s.execute(stmt)
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_pending(self) -> list[HackathonSubmissionEntity]:
        """List pending submissions for worker to process."""
        r = await self._s.execute(
            select(HackathonSubmission)
            .where(HackathonSubmission.status == SubmissionStatus.PENDING)
            .order_by(HackathonSubmission.submitted_at)
        )
        return [m.to_entity() for m in r.scalars().all()]

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
        if not model:
            raise ValueError(f"Submission {entity.id} not found")

        model.status = entity.status
        model.score = entity.score
        model.execution_log = entity.execution_log
        model.error_message = entity.error_message
        model.started_at = entity.started_at
        model.completed_at = entity.completed_at

        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def delete(self, entity: HackathonSubmissionEntity) -> None:
        r = await self._s.execute(
            select(HackathonSubmission).where(HackathonSubmission.id == entity.id)
        )
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
