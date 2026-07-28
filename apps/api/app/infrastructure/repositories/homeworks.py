from uuid import UUID

from sqlalchemy import delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.datetime_utils import now_ict
from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity
from app.domain.interfaces.homework_repo import IHomeworkRepository
from app.infrastructure.persistence.models.homework import (
    Homework,
    HomeworkAssignment,
    HomeworkSubmission,
)
from app.infrastructure.persistence.models.lesson import Lesson


class HomeworkRepository(IHomeworkRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def list_homeworks(
        self,
        user_id: int | None = None,
        lesson_id: UUID | None = None,
    ) -> list[HomeworkEntity]:
        stmt = select(Homework).where(Homework.archived_at.is_(None))
        if lesson_id is not None:
            stmt = stmt.where(Homework.lesson_id == lesson_id)
        if user_id is not None:
            stmt = stmt.join(
                HomeworkAssignment,
                HomeworkAssignment.homework_id == Homework.id,
            ).where(HomeworkAssignment.user_id == user_id)
        stmt = stmt.order_by(Homework.deadline.asc())
        models = list((await self._session.scalars(stmt)).all())
        if not models:
            return []
        ids = [model.id for model in models]
        assignment_rows = (
            await self._session.execute(
                select(HomeworkAssignment.homework_id, HomeworkAssignment.user_id)
                .where(HomeworkAssignment.homework_id.in_(ids))
                .order_by(HomeworkAssignment.user_id)
            )
        ).all()
        assignments: dict[UUID, list[int]] = {}
        for homework_id, assigned_user_id in assignment_rows:
            assignments.setdefault(homework_id, []).append(assigned_user_id)
        return [model.to_entity(assignments.get(model.id, [])) for model in models]

    async def lesson_exists(self, lesson_id: UUID) -> bool:
        return (
            await self._session.scalar(
                select(Lesson.id).where(Lesson.id == lesson_id)
            )
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
        assignees = list(
            (
                await self._session.scalars(
                    select(HomeworkAssignment.user_id).where(
                        HomeworkAssignment.homework_id == homework_id
                    )
                )
            ).all()
        )
        return model.to_entity(assignees)

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
        model.title = homework.title
        model.lesson_id = homework.lesson_id
        model.description = homework.description
        model.deadline = homework.deadline
        model.attachment_key = homework.attachment_key
        model.updated_at = now_ict()
        await self._session.flush()
        return model.to_entity(homework.assignee_ids)

    async def archive_homework(self, homework_id: UUID) -> bool:
        model = await self._session.get(Homework, homework_id)
        if model is None or model.archived_at is not None:
            return False
        model.archived_at = now_ict()
        await self._session.flush()
        return True

    async def replace_assignments(
        self, homework_id: UUID, user_ids: set[int]
    ) -> None:
        await self._session.execute(
            delete(HomeworkAssignment).where(
                HomeworkAssignment.homework_id == homework_id
            )
        )
        self._session.add_all(
            [
                HomeworkAssignment(homework_id=homework_id, user_id=user_id)
                for user_id in sorted(user_ids)
            ]
        )
        await self._session.flush()

    async def is_assigned(self, homework_id: UUID, user_id: int) -> bool:
        return (
            await self._session.scalar(
                select(HomeworkAssignment.user_id).where(
                    HomeworkAssignment.homework_id == homework_id,
                    HomeworkAssignment.user_id == user_id,
                )
            )
            is not None
        )

    async def create_submission(
        self, submission: HomeworkSubmissionEntity
    ) -> HomeworkSubmissionEntity:
        # Lock the assignment so concurrent uploads cannot receive the same attempt.
        await self._session.execute(
            select(HomeworkAssignment)
            .where(
                HomeworkAssignment.homework_id == submission.homework_id,
                HomeworkAssignment.user_id == submission.user_id,
            )
            .with_for_update()
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

    async def unsubmitted_user_ids(self, homework_id: UUID) -> list[int]:
        submitted = select(HomeworkSubmission.user_id).where(
            HomeworkSubmission.homework_id == homework_id
        )
        return list(
            (
                await self._session.scalars(
                    select(HomeworkAssignment.user_id).where(
                        HomeworkAssignment.homework_id == homework_id,
                        HomeworkAssignment.user_id.not_in(submitted),
                    )
                )
            ).all()
        )
