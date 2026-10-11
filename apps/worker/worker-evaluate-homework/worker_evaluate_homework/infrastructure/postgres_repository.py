from datetime import timedelta
from typing import Any
from uuid import UUID

from app.core.datetime_utils import now_ict
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkSubmission,
    HomeworkSubmissionFingerprint,
)
from sqlalchemy import and_, delete, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from worker_evaluate_homework.domain import (
    GradeResult,
    HomeworkGradingRecord,
    StoredFingerprint,
    SubmissionGradingRecord,
    SubmissionGradingStatus,
)
from worker_evaluate_homework.domain.retry import GradingAttempt, GradingRetryPolicy


class PostgresHomeworkGradingRepository:
    def __init__(
        self,
        retry_policy: GradingRetryPolicy,
        session_factory: async_sessionmaker[AsyncSession] | None = None,
    ) -> None:
        self._retry_policy = retry_policy
        self._sessions = session_factory or AsyncSessionLocal

    async def get_homework(
        self,
        homework_id: UUID,
    ) -> HomeworkGradingRecord | None:
        async with self._sessions() as session:
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

    async def claim_homework(self, homework_id: UUID) -> GradingAttempt | None:
        now = now_ict()
        expired = now - self._retry_policy.lease_duration
        async with self._sessions() as session:
            claimed = (
                await session.execute(
                    update(Homework)
                    .where(
                        Homework.id == homework_id,
                        Homework.archived_at.is_(None),
                        Homework.grading_status.in_(["PENDING", "PROCESSING", "FAILED"]),
                        Homework.grading_retryable.is_(True),
                        Homework.grading_attempts < self._retry_policy.max_attempts,
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
                    .returning(Homework.grading_attempts, Homework.grading_started_at)
                )
            ).first()
            await session.commit()
            return GradingAttempt(*claimed) if claimed is not None else None

    async def save_homework_rubric(
        self,
        homework_id: UUID,
        rubric: dict[str, Any],
        *,
        attempt: GradingAttempt,
    ) -> bool:
        async with self._sessions() as session:
            model = await self._owned_homework(session, homework_id, attempt)
            if model is None:
                return False
            model.grading_rubric = rubric
            model.grading_status = "READY"
            model.grading_error = None
            model.grading_started_at = None
            await session.commit()
            return True

    async def save_homework_error(
        self,
        homework_id: UUID,
        error: str,
        *,
        attempt: GradingAttempt,
        retryable: bool = False,
    ) -> bool:
        async with self._sessions() as session:
            model = await self._owned_homework(session, homework_id, attempt)
            if model is None:
                return False
            model.grading_status = "FAILED"
            model.grading_error = error[:2000]
            model.grading_retryable = retryable
            model.grading_started_at = None
            await session.commit()
            return True

    async def get_submission(
        self,
        submission_id: UUID,
    ) -> SubmissionGradingRecord | None:
        async with self._sessions() as session:
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

    async def claim_submission(self, submission_id: UUID) -> GradingAttempt | None:
        now = now_ict()
        expired = now - self._retry_policy.lease_duration
        async with self._sessions() as session:
            claimed = (
                await session.execute(
                    update(HomeworkSubmission)
                    .where(
                        HomeworkSubmission.id == submission_id,
                        HomeworkSubmission.status.in_(["UPLOADED", "GRADING", "FAILED"]),
                        HomeworkSubmission.grading_retryable.is_(True),
                        HomeworkSubmission.grading_attempts < self._retry_policy.max_attempts,
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
                    .returning(
                        HomeworkSubmission.grading_attempts, HomeworkSubmission.grading_started_at
                    )
                )
            ).first()
            await session.commit()
            return GradingAttempt(*claimed) if claimed is not None else None

    async def save_submission_result(
        self,
        submission_id: UUID,
        result: GradeResult,
        plagiarism: list[dict[str, Any]],
        copied_user_id: int | None,
        *,
        attempt: GradingAttempt,
        fingerprints: list[dict[str, Any]],
    ) -> bool:
        async with self._sessions() as session:
            model = await self._owned_submission(session, submission_id, attempt)
            if model is None:
                return False
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
            # Fingerprints and the result belong to the same claim and transaction.
            await session.execute(
                delete(HomeworkSubmissionFingerprint).where(
                    HomeworkSubmissionFingerprint.submission_id == submission_id
                )
            )
            session.add_all(
                [
                    HomeworkSubmissionFingerprint(
                        submission_id=submission_id,
                        homework_id=model.homework_id,
                        user_id=model.user_id,
                        file_name=value["file_name"],
                        code_hash=value["code_hash"],
                        fingerprints=value["fingerprints"],
                    )
                    for value in fingerprints
                ]
            )
            await session.commit()
            return True

    async def save_submission_error(
        self,
        submission_id: UUID,
        error: str,
        *,
        attempt: GradingAttempt,
        final: bool,
        retryable: bool = False,
    ) -> bool:
        async with self._sessions() as session:
            model = await self._owned_submission(session, submission_id, attempt)
            if model is None:
                return False
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
            return True

    @staticmethod
    async def _owned_homework(
        session: AsyncSession, homework_id: UUID, attempt: GradingAttempt
    ) -> Homework | None:
        return await session.scalar(
            select(Homework)
            .where(
                Homework.id == homework_id,
                Homework.grading_status == "PROCESSING",
                Homework.grading_attempts == attempt.number,
                Homework.grading_started_at == attempt.started_at,
            )
            .with_for_update()
        )

    @staticmethod
    async def _owned_submission(
        session: AsyncSession, submission_id: UUID, attempt: GradingAttempt
    ) -> HomeworkSubmission | None:
        return await session.scalar(
            select(HomeworkSubmission)
            .where(
                HomeworkSubmission.id == submission_id,
                HomeworkSubmission.status == SubmissionGradingStatus.GRADING.value,
                HomeworkSubmission.grading_attempts == attempt.number,
                HomeworkSubmission.grading_started_at == attempt.started_at,
            )
            .with_for_update()
        )

    async def list_previous_fingerprints(
        self,
        homework_id: UUID,
        user_id: int,
        file_names: list[str],
    ) -> list[StoredFingerprint]:
        if not file_names:
            return []
        normalized_file_names = {name.casefold() for name in file_names}
        async with self._sessions() as session:
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

    async def list_stale_homework_ids(
        self,
        stale_minutes: int = 10,
        days_limit: int = 7,
        limit: int = 10,
    ) -> list[UUID]:
        now = now_ict()
        cutoff_created = now - timedelta(days=days_limit)
        cutoff_stale = now - max(
            timedelta(minutes=stale_minutes), self._retry_policy.lease_duration
        )

        stmt = (
            select(Homework.id)
            .where(
                Homework.archived_at.is_(None),
                Homework.created_at >= cutoff_created,
                Homework.grading_retryable.is_(True),
                Homework.grading_attempts < self._retry_policy.max_attempts,
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
                    Homework.grading_status == "FAILED",
                ),
            )
            .order_by(Homework.created_at.asc())
            .limit(limit)
        )
        async with self._sessions() as session:
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
        cutoff_stale = now - max(
            timedelta(minutes=stale_minutes), self._retry_policy.lease_duration
        )

        stmt = (
            select(HomeworkSubmission.id)
            .join(Homework, HomeworkSubmission.homework_id == Homework.id)
            .where(
                Homework.archived_at.is_(None),
                Homework.grading_status == "READY",
                HomeworkSubmission.submitted_at >= cutoff_submitted,
                HomeworkSubmission.grading_retryable.is_(True),
                HomeworkSubmission.grading_attempts < self._retry_policy.max_attempts,
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
        async with self._sessions() as session:
            result = await session.execute(stmt)
            return list(result.scalars().all())
