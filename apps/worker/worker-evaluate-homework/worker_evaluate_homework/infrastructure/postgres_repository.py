from typing import Any
from uuid import UUID

from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkSubmission,
    HomeworkSubmissionFingerprint,
)
from sqlalchemy import delete, func, select

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

    async def set_homework_processing(self, homework_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(Homework, homework_id)
            if model is None:
                raise ValueError(f"Homework {homework_id} not found")
            model.grading_status = "PROCESSING"
            model.grading_error = None
            await session.commit()

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
            await session.commit()

    async def save_homework_error(
        self,
        homework_id: UUID,
        error: str,
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(Homework, homework_id)
            if model is None:
                return
            model.grading_status = "FAILED"
            model.grading_error = error[:2000]
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

    async def set_submission_grading(self, submission_id: UUID) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(HomeworkSubmission, submission_id)
            if model is None:
                raise ValueError(f"Submission {submission_id} not found")
            model.status = SubmissionGradingStatus.GRADING.value
            model.grading_error = None
            await session.commit()

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
            await session.commit()

    async def save_submission_error(
        self,
        submission_id: UUID,
        error: str,
        *,
        final: bool,
    ) -> None:
        async with AsyncSessionLocal() as session:
            model = await session.get(HomeworkSubmission, submission_id)
            if model is None:
                return
            model.status = (
                SubmissionGradingStatus.FAILED.value
                if final
                else SubmissionGradingStatus.GRADING.value
            )
            if final:
                model.is_pass = False
                model.score = 0.0
            model.grading_error = error[:2000]
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
