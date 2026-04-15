from datetime import datetime
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models import Exam


class ExamRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, exam_id: UUID) -> Exam | None:
        r = await self._s.execute(select(Exam).where(Exam.id == exam_id))
        return r.scalar_one_or_none()

    async def list_for_teacher(self, user_id: int) -> list[Exam]:
        r = await self._s.execute(select(Exam).where(Exam.created_by == user_id).order_by(Exam.title))
        return list(r.scalars().all())

    async def list_published_for_student(self, now: datetime) -> list[Exam]:
        stmt = select(Exam).where(Exam.is_published.is_(True))
        stmt = stmt.where((Exam.start_time.is_(None)) | (Exam.start_time <= now))
        stmt = stmt.where((Exam.end_time.is_(None)) | (Exam.end_time >= now))
        r = await self._s.execute(stmt.order_by(Exam.title))
        return list(r.scalars().all())

    async def add(self, exam: Exam) -> Exam:
        self._s.add(exam)
        await self._s.flush()
        await self._s.refresh(exam)
        return exam

    async def delete(self, exam: Exam) -> None:
        await self._s.delete(exam)
