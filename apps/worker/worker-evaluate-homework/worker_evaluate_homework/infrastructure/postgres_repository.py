from datetime import timedelta
from typing import Any
from uuid import UUID

from app.config import settings
from app.core.datetime_utils import now_ict
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkSubmission,
    HomeworkSubmissionFingerprint,
)
from sqlalchemy import and_, delete, func, or_, select, update

from worker_evaluate_homework.domain import (
    GradeResult,
    HomeworkGradingRecord,
    StoredFingerprint,
    SubmissionGradingRecord,
    SubmissionGradingStatus,
)


class PostgresHomeworkGradingRepository:
    async def get_homework(
        self,
        homework_id: UUID,
    ) -> HomeworkGradingRecord | None:
        async with AsyncSessionLocal() as session:
            model = await session.get(Homework, homework_id)
            if model is None:
                return None
            return HomeworkGradingRecord(
                id=model.id,
                title=model.title,
                description=model.description,
                attachment_key=model.attachment_key,
                grading_rubric=model.grading_rubric,
            )

    async def set_homework_processing(self, homework_id: UUID) -> bool:
        now = now_ict()
        expired = now - timedelta(seconds=settings.homework_grading_timeout_seconds + 60)
        async with AsyncSessionLocal() as session:
            claimed = await session.scalar(
                update(Homework)
                .where(
                    Homework.id == homework_id,
                    Homework.grading_status != "READY",
                    Homework.grading_retryable.is_(True),
                    Homework.grading_attempts < settings.homework_grading_max_attempts,
                    or_(
                        Homework.grading_status != "PROCESSING",
                        Homework.grading_started_at.is_(None),
                        Homework.grading_started_at < expired,
                    ),
                )
                .values(
                    grading_status="PROCESSING",
                    grading_error=None,
                    grading_started_at=now,
                    grading_attempts=Homework.grading_attempts + 1,
                )
                .returning(Homework.id)
            )
            await session.commit()
            return claimed is not None

    async def save_homework_rubric(
        self,
        homework_id: UUID,
        rubric: dict[str, Any],
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(Homework, homework_id)
            if model is None:
                raise ValueError(f"Homework {homework_id} not found")
            model.grading_rubric = rubric
            model.grading_status = "READY"
            model.grading_error = None
            model.grading_started_at = None
            await session.commit()

    async def save_homework_error(
        self,
        homework_id: UUID,
        error: str,
        *,
        retryable: bool = False,
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(Homework, homework_id)
            if model is None:
                return
            model.grading_status = "FAILED"
            model.grading_error = error[:2000]
            model.grading_retryable = retryable
            model.grading_started_at = None
            await session.commit()

    async def get_submission(
        self,
        submission_id: UUID,
    ) -> SubmissionGradingRecord | None:
        async with AsyncSessionLocal() as session:
            model = await session.get(HomeworkSubmission, submission_id)
            if model is None:
                return None
            return SubmissionGradingRecord(
                id=model.id,
                homework_id=model.homework_id,
                user_id=model.user_id,
                object_key=model.object_key,
                status=model.status,
                score=model.score,
            )

    async def set_submission_grading(self, submission_id: UUID) -> bool:
        now = now_ict()
        expired = now - timedelta(seconds=settings.homework_grading_timeout_seconds + 60)
        async with AsyncSessionLocal() as session:
            claimed = await session.scalar(
                update(HomeworkSubmission)
                .where(
                    HomeworkSubmission.id == submission_id,
                    HomeworkSubmission.status != SubmissionGradingStatus.GRADED.value,
                    HomeworkSubmission.grading_retryable.is_(True),
                    HomeworkSubmission.grading_attempts < settings.homework_grading_max_attempts,
                    or_(
                        HomeworkSubmission.status != SubmissionGradingStatus.GRADING.value,
                        HomeworkSubmission.grading_started_at.is_(None),
                        HomeworkSubmission.grading_started_at < expired,
                    ),
                )
                .values(
                    status=SubmissionGradingStatus.GRADING.value,
                    grading_error=None,
                    grading_started_at=now,
                    grading_attempts=HomeworkSubmission.grading_attempts + 1,
                )
                .returning(HomeworkSubmission.id)
            )
            await session.commit()
            return claimed is not None

    async def save_submission_result(
        self,
        submission_id: UUID,
        result: GradeResult,
        plagiarism: list[dict[str, Any]],
        copied_user_id: int | None,
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(HomeworkSubmission, submission_id)
            if model is None:
                raise ValueError(f"Submission {submission_id} not found")
            model.status = SubmissionGradingStatus.GRADED.value
            model.is_pass = result.is_pass
            model.score = result.score
            model.feedback = result.feedback
            model.score_details = result.score_details
            model.plagiarism_info = plagiarism
            model.is_plagiarized = copied_user_id is not None
            model.plagiarized_from_user_id = copied_user_id
            model.grading_error = None
            model.grading_started_at = None
            await session.commit()

    async def save_submission_error(
        self,
        submission_id: UUID,
        error: str,
        *,
        final: bool,
        retryable: bool = False,
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(HomeworkSubmission, submission_id)
            if model is None:
                return
            final = final or model.grading_attempts >= settings.homework_grading_max_attempts
            model.status = (
                SubmissionGradingStatus.FAILED.value
                if final
                else SubmissionGradingStatus.GRADING.value
            )
            if final:
                model.is_pass = False
                model.score = 0.0
            model.grading_error = error[:2000]
            model.grading_retryable = retryable
            model.grading_started_at = None
            await session.commit()

    async def list_previous_fingerprints(
        self,
        homework_id: UUID,
        user_id: int,
        file_names: list[str],
    ) -> list[StoredFingerprint]:
        if not file_names:
            return []
        normalized_file_names = {name.casefold() for name in file_names}
        async with AsyncSessionLocal() as session:
            rows = (
                await session.scalars(
                    select(HomeworkSubmissionFingerprint).where(
                        HomeworkSubmissionFingerprint.homework_id == homework_id,
                        HomeworkSubmissionFingerprint.user_id != user_id,
                        func.lower(HomeworkSubmissionFingerprint.file_name).in_(
                            normalized_file_names
                        ),
                    )
                )
            ).all()
            return [
                StoredFingerprint(
                    user_id=row.user_id,
                    file_name=row.file_name,
                    fingerprints=frozenset(row.fingerprints),
                )
                for row in rows
            ]

    async def replace_fingerprints(
        self,
        submission: SubmissionGradingRecord,
        values: list[dict[str, Any]],
    ) -> None:
        async with AsyncSessionLocal() as session:
            await session.execute(
                delete(HomeworkSubmissionFingerprint).where(
                    HomeworkSubmissionFingerprint.submission_id == submission.id
                )
            )
            session.add_all(
                [
                    HomeworkSubmissionFingerprint(
                        submission_id=submission.id,
                        homework_id=submission.homework_id,
                        user_id=submission.user_id,
                        file_name=value["file_name"],
                        code_hash=value["code_hash"],
                        fingerprints=value["fingerprints"],
                    )
                    for value in values
                ]
            )
            await session.commit()

    async def list_stale_homework_ids(
        self,
        stale_minutes: int = 10,
        days_limit: int = 7,
        limit: int = 10,
    ) -> list[UUID]:
        now = now_ict()
        cutoff_created = now - timedelta(days=days_limit)
        cutoff_stale = now - timedelta(
            seconds=max(
                stale_minutes * 60,
                settings.homework_grading_timeout_seconds + 60,
            )
        )

        stmt = (
            select(Homework.id)
            .where(
                Homework.archived_at.is_(None),
                Homework.created_at >= cutoff_created,
                Homework.grading_retryable.is_(True),
                Homework.grading_attempts < settings.homework_grading_max_attempts,
                or_(
                    Homework.grading_status == "PENDING",
                    and_(
                        Homework.grading_status == "PROCESSING",
                        or_(
                            Homework.grading_started_at < cutoff_stale,
                            and_(
                                Homework.grading_started_at.is_(None),
                                Homework.updated_at < cutoff_stale,
                            ),
                        ),
                    ),
                    and_(
                        Homework.grading_status == "FAILED",
                    ),
                ),
            )
            .order_by(Homework.created_at.asc())
            .limit(limit)
        )
        async with AsyncSessionLocal() as session:
            result = await session.execute(stmt)
            return list(result.scalars().all())

    async def list_stale_submission_ids(
        self,
        stale_minutes: int = 15,
        days_limit: int = 7,
        limit: int = 20,
    ) -> list[UUID]:
        now = now_ict()
        cutoff_submitted = now - timedelta(days=days_limit)
        cutoff_stale = now - timedelta(
            seconds=max(
                stale_minutes * 60,
                settings.homework_grading_timeout_seconds + 60,
            )
        )

        stmt = (
            select(HomeworkSubmission.id)
            .join(Homework, HomeworkSubmission.homework_id == Homework.id)
            .where(
                Homework.archived_at.is_(None),
                Homework.grading_status == "READY",
                HomeworkSubmission.submitted_at >= cutoff_submitted,
                HomeworkSubmission.grading_retryable.is_(True),
                HomeworkSubmission.grading_attempts < settings.homework_grading_max_attempts,
                or_(
                    HomeworkSubmission.status == SubmissionGradingStatus.UPLOADED.value,
                    and_(
                        HomeworkSubmission.status == SubmissionGradingStatus.GRADING.value,
                        or_(
                            HomeworkSubmission.grading_started_at < cutoff_stale,
                            and_(
                                HomeworkSubmission.grading_started_at.is_(None),
                                HomeworkSubmission.submitted_at < cutoff_stale,
                            ),
                        ),
                    ),
                    HomeworkSubmission.status == SubmissionGradingStatus.FAILED.value,
                ),
            )
            .order_by(HomeworkSubmission.submitted_at.asc())
            .limit(limit)
        )
        async with AsyncSessionLocal() as session:
            result = await session.execute(stmt)
            return list(result.scalars().all())
