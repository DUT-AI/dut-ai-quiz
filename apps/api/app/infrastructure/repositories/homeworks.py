from uuid import UUID

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.dtos.homework import (
    CompletedHomeworkMemberOutDTO,
    HomeworkSubmissionSyncOutDTO,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)
from app.domain.interfaces.homework_repo import IHomeworkRepository
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkSubmission,
)
from app.infrastructure.persistence.models.lesson import Lesson


class HomeworkRepository(IHomeworkRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_homeworks(
        self,
        lesson_id: UUID | None = None,
    ) -> list[HomeworkEntity]:
        stmt = select(Homework).where(Homework.archived_at.is_(None))
        if lesson_id is not None:
            stmt = stmt.where(Homework.lesson_id == lesson_id)
        stmt = stmt.order_by(Homework.created_at.desc())
        models = list((await self._session.scalars(stmt)).all())
        return [model.to_entity() for model in models]

    async def lesson_exists(self, lesson_id: UUID) -> bool:
        return (
            await self._session.scalar(select(Lesson.id).where(Lesson.id == lesson_id)) is not None
        )

    async def get_homework(self, homework_id: UUID) -> HomeworkEntity | None:
        model = await self._session.scalar(
            select(Homework).where(
                Homework.id == homework_id,
                Homework.archived_at.is_(None),
            )
        )
        if model is None:
            return None
        return model.to_entity()

    async def create_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        model = Homework(
            id=homework.id,
            lesson_id=homework.lesson_id,
            title=homework.title,
            description=homework.description,
            attachment_key=homework.attachment_key,
            created_by=homework.created_by,
            grading_status=homework.grading_status,
            grading_error=homework.grading_error,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return model.to_entity()

    async def update_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        model = await self._session.get(Homework, homework.id)
        if model is None:
            raise ValueError("Homework not found")
        grading_content_changed = (
            model.title != homework.title
            or model.description != homework.description
            or model.attachment_key != homework.attachment_key
        )
        model.title = homework.title
        model.lesson_id = homework.lesson_id
        model.description = homework.description
        model.attachment_key = homework.attachment_key
        if grading_content_changed:
            model.grading_rubric = None
            model.grading_status = "PENDING"
            model.grading_error = None
        model.updated_at = now_ict()
        await self._session.flush()
        return model.to_entity()

    async def archive_homework(self, homework_id: UUID) -> bool:
        model = await self._session.get(Homework, homework_id)
        if model is None or model.archived_at is not None:
            return False
        model.archived_at = now_ict()
        await self._session.flush()
        return True

    async def create_submission(
        self, submission: HomeworkSubmissionEntity
    ) -> HomeworkSubmissionEntity:
        # Serialize attempts per homework/user even when the user is not assigned.
        await self._session.execute(
            select(
                func.pg_advisory_xact_lock(
                    func.hashtext(f"{submission.homework_id}:{submission.user_id}")
                )
            )
        )
        latest_attempt = await self._session.scalar(
            select(func.max(HomeworkSubmission.attempt_number)).where(
                HomeworkSubmission.homework_id == submission.homework_id,
                HomeworkSubmission.user_id == submission.user_id,
            )
        )
        model = HomeworkSubmission(
            id=submission.id,
            homework_id=submission.homework_id,
            user_id=submission.user_id,
            object_key=submission.object_key,
            original_filename=submission.original_filename,
            submitted_at=submission.submitted_at,
            is_late=submission.is_late,
            attempt_number=int(latest_attempt or 0) + 1,
            status=submission.status.value,
        )
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return model.to_entity()

    async def get_submission(self, submission_id: UUID) -> HomeworkSubmissionEntity | None:
        model = await self._session.get(HomeworkSubmission, submission_id)
        return model.to_entity() if model else None

    async def get_latest_submission(
        self, homework_id: UUID, user_id: int
    ) -> HomeworkSubmissionEntity | None:
        model = await self._session.scalar(
            select(HomeworkSubmission)
            .where(
                HomeworkSubmission.homework_id == homework_id,
                HomeworkSubmission.user_id == user_id,
            )
            .order_by(HomeworkSubmission.attempt_number.desc())
            .limit(1)
        )
        return model.to_entity() if model else None

    async def retry_failed_submission(self, submission_id: UUID) -> HomeworkSubmissionEntity | None:
        model = await self._session.scalar(
            update(HomeworkSubmission)
            .where(
                HomeworkSubmission.id == submission_id,
                HomeworkSubmission.status == HomeworkSubmissionStatus.FAILED.value,
            )
            .values(
                status=HomeworkSubmissionStatus.GRADING.value,
                is_pass=None,
                score=None,
                feedback=None,
                score_details=None,
                plagiarism_info=None,
                is_plagiarized=False,
                plagiarized_from_user_id=None,
                grading_error=None,
            )
            .returning(HomeworkSubmission)
        )
        if model is None:
            return None
        await self._session.flush()
        return model.to_entity()

    async def list_submissions(self, homework_id: UUID) -> list[HomeworkSubmissionEntity]:
        models = (
            await self._session.scalars(
                select(HomeworkSubmission)
                .where(HomeworkSubmission.homework_id == homework_id)
                .order_by(
                    HomeworkSubmission.user_id,
                    HomeworkSubmission.attempt_number.desc(),
                )
            )
        ).all()
        return [model.to_entity() for model in models]

    async def list_completed_user_ids(self, homework_id: UUID) -> list[int]:
        stmt = (
            select(HomeworkSubmission.user_id)
            .distinct()
            .where(HomeworkSubmission.homework_id == homework_id)
            .order_by(HomeworkSubmission.user_id)
        )
        return [int(user_id) for user_id in (await self._session.scalars(stmt)).all()]

    async def list_completed_members_by_lesson(
        self, lesson_id: UUID
    ) -> list[CompletedHomeworkMemberOutDTO]:
        total_active = await self.count_active_by_lesson(lesson_id)
        if total_active == 0:
            return []

        stmt = (
            select(
                HomeworkSubmission.user_id,
                func.count(func.distinct(HomeworkSubmission.homework_id)).label("completed_exercises_count"),
                func.count(HomeworkSubmission.id).label("submission_count"),
                func.max(HomeworkSubmission.score).label("max_score"),
                func.max(HomeworkSubmission.submitted_at).label("submitted_at"),
            )
            .join(Homework, Homework.id == HomeworkSubmission.homework_id)
            .where(
                Homework.lesson_id == lesson_id,
                Homework.archived_at.is_(None),
            )
            .group_by(HomeworkSubmission.user_id)
            .having(func.count(func.distinct(HomeworkSubmission.homework_id)) >= total_active)
            .order_by(HomeworkSubmission.user_id)
        )
        rows = (await self._session.execute(stmt)).all()
        return [
            CompletedHomeworkMemberOutDTO(
                user_id=row.user_id,
                submission_count=int(row.submission_count or 0),
                max_score=float(row.max_score) if row.max_score is not None else None,
                submitted_at=row.submitted_at,
            )
            for row in rows
        ]

    async def count_submitters(self, homework_id: UUID) -> int:
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(HomeworkSubmission.user_id))).where(
                    HomeworkSubmission.homework_id == homework_id
                )
            )
            or 0
        )

    async def count_active_by_lesson(self, lesson_id: UUID) -> int:
        stmt = (
            select(func.count(Homework.id))
            .where(
                Homework.lesson_id == lesson_id,
                Homework.archived_at.is_(None),
            )
        )
        return int(await self._session.scalar(stmt) or 0)

    async def list_submissions_for_sync_by_lesson(
        self, lesson_id: UUID
    ) -> list[HomeworkSubmissionSyncOutDTO]:
        stmt = (
            select(HomeworkSubmission, Homework.title.label("exercise_title"))
            .join(Homework, Homework.id == HomeworkSubmission.homework_id)
            .where(
                Homework.lesson_id == lesson_id,
                Homework.archived_at.is_(None),
            )
            .order_by(HomeworkSubmission.submitted_at.asc())
        )
        results = (await self._session.execute(stmt)).all()
        return [
            HomeworkSubmissionSyncOutDTO(
                submission_id=str(row[0].id),
                homework_id=str(row[0].homework_id),
                exercise_id=str(row[0].homework_id),
                exercise_title=str(row[1]) if row[1] else None,
                user_id=row[0].user_id,
                attempt_number=row[0].attempt_number,
                original_filename=row[0].original_filename,
                submitted_at=row[0].submitted_at,
                status=str(row[0].status.value if hasattr(row[0].status, "value") else row[0].status),
                is_pass=row[0].is_pass,
                score=float(row[0].score) if row[0].score is not None else None,
                score_details=row[0].score_details or [],
            )
            for row in results
        ]


