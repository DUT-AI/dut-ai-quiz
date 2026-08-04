from datetime import datetime
from uuid import UUID

from sqlalchemy import and_, func, or_, select

from app.domain.entities.hackathon import HackathonTaskEntity
from app.domain.entities.submission import HackathonSubmissionEntity, SubmissionStatus
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models import HackathonSubmission, HackathonTask
from worker_hackathon.domain.interfaces.submission_repository import ISubmissionRepository


class PostgresSubmissionRepository(ISubmissionRepository):
    async def get_submission(
        self, submission_id: UUID
    ) -> HackathonSubmissionEntity | None:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(HackathonSubmission).where(
                    HackathonSubmission.id == submission_id
                )
            )
            model = result.scalar_one_or_none()
            return model.to_entity() if model else None

    async def get_task(self, task_id: UUID) -> HackathonTaskEntity | None:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(HackathonTask).where(HackathonTask.id == task_id)
            )
            model = result.scalar_one_or_none()
            return model.to_entity() if model else None

    async def update_submission(
        self, submission: HackathonSubmissionEntity
    ) -> HackathonSubmissionEntity:
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(HackathonSubmission).where(
                    HackathonSubmission.id == submission.id
                )
            )
            model = result.scalar_one_or_none()
            if not model:
                raise ValueError(f"Submission not found: {submission.id}")

            model.status = submission.status
            model.public_score = submission.public_score
            model.private_score = submission.private_score
            model.inference_time = submission.inference_time
            model.error_message = submission.error_message
            model.logs = submission.logs
            model.updated_at = submission.updated_at or datetime.now()

            await session.commit()
            await session.refresh(model)
            return model.to_entity()

    async def list_stale_active_submissions(
        self,
        uploading_stale_before: datetime,
        processing_stale_before: datetime,
    ) -> list[HackathonSubmissionEntity]:
        processing_statuses = (
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.RUNNING,
            SubmissionStatus.EVALUATING,
        )
        async with AsyncSessionLocal() as session:
            result = await session.execute(
                select(HackathonSubmission).where(
                    or_(
                        and_(
                            HackathonSubmission.status == SubmissionStatus.UPLOADING,
                            HackathonSubmission.created_at < uploading_stale_before,
                        ),
                        and_(
                            HackathonSubmission.status.in_(processing_statuses),
                            func.coalesce(
                                HackathonSubmission.updated_at,
                                HackathonSubmission.created_at,
                            )
                            < processing_stale_before,
                        ),
                    )
                )
            )
            return [model.to_entity() for model in result.scalars().all()]
