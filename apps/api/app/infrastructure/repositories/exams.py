from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.exam import ExamEntity
from app.domain.interfaces import IExamRepository
from app.infrastructure.persistence.models import Exam


class ExamRepository(IExamRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, exam_id: UUID) -> ExamEntity | None:
        r = await self._s.execute(select(Exam).where(Exam.id == exam_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_for_teacher(self, user_id: int) -> list[ExamEntity]:
        stmt = select(Exam).where(
            (Exam.created_by == user_id)
            | ((Exam.participant_ids.any(user_id)) & (Exam.is_published.is_(True)))
        )
        r = await self._s.execute(stmt.order_by(Exam.title))
        return [m.to_entity() for m in r.scalars().all()]

    async def list_published_for_student(
        self, user_id: int, now: datetime
    ) -> list[ExamEntity]:
        # Condition for exams where the user is a participant
        participant_cond = (
            (Exam.is_published.is_(True))
            & ((Exam.start_time.is_(None)) | (Exam.start_time <= now))
            & ((Exam.end_time.is_(None)) | (Exam.end_time >= now))
            & (Exam.participant_ids.any(user_id))
        )
        # Condition for exams created by the user (allows teachers to see/test all their exams)
        creator_cond = Exam.created_by == user_id

        stmt = select(Exam).where(participant_cond | creator_cond)
        r = await self._s.execute(stmt.order_by(Exam.title))
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: ExamEntity) -> ExamEntity:
        model = Exam.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def update(self, entity: ExamEntity) -> ExamEntity:
        r = await self._s.execute(select(Exam).where(Exam.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.title = entity.title
            model.description = entity.description
            model.start_time = entity.start_time
            model.end_time = entity.end_time
            model.duration_minutes = entity.duration_minutes
            model.max_attempts = entity.max_attempts
            model.is_published = entity.is_published
            model.show_answers = entity.show_answers
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Exam not found")

    async def delete(self, entity: ExamEntity) -> None:
        r = await self._s.execute(select(Exam).where(Exam.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            await self._s.delete(model)
