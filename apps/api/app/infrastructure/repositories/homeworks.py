from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import now_ict
from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity
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
        stmt = stmt.order_by(Homework.deadline.asc())
        models = list((await self._session.scalars(stmt)).all())
        return [model.to_entity() for model in models]

    async def lesson_exists(self, lesson_id: UUID) -> bool:
        return (
            await self._session.scalar(select(Lesson.id).where(Lesson.id == lesson_id))
            is not None
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
            lesson_id=homework.lesson_id,
            title=homework.title,
            description=homework.description,
            deadline=homework.deadline,
            attachment_key=homework.attachment_key,
            created_by=homework.created_by,
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
        model.deadline = homework.deadline
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
        # Serialize attempt numbering per homework/user under concurrent submits.
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

    async def get_submission(
        self, submission_id: UUID
    ) -> HomeworkSubmissionEntity | None:
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

    async def list_submissions(
        self, homework_id: UUID
    ) -> list[HomeworkSubmissionEntity]:
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

    async def count_submitters(self, homework_id: UUID) -> int:
        return int(
            await self._session.scalar(
                select(func.count(func.distinct(HomeworkSubmission.user_id))).where(
                    HomeworkSubmission.homework_id == homework_id
                )
            )
            or 0
        )
