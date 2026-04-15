from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.infrastructure.persistence.models import Attempt, AttemptAnswer, AttemptStatus


class AttemptRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def count_for_user_exam(self, user_id: int, exam_id: UUID) -> int:
        r = await self._s.execute(
            select(func.count())
            .select_from(Attempt)
            .where(Attempt.user_id == user_id, Attempt.exam_id == exam_id)
        )
        return int(r.scalar_one() or 0)

    async def count_completed_for_user_exam(self, user_id: int, exam_id: UUID) -> int:
        r = await self._s.execute(
            select(func.count())
            .select_from(Attempt)
            .where(
                Attempt.user_id == user_id,
                Attempt.exam_id == exam_id,
                Attempt.status == AttemptStatus.COMPLETED,
            )
        )
        return int(r.scalar_one() or 0)

    async def get(self, attempt_id: UUID) -> Attempt | None:
        r = await self._s.execute(select(Attempt).where(Attempt.id == attempt_id))
        return r.scalar_one_or_none()

    async def add(self, attempt: Attempt) -> Attempt:
        self._s.add(attempt)
        await self._s.flush()
        await self._s.refresh(attempt)
        return attempt

    async def save(self, attempt: Attempt) -> Attempt:
        await self._s.flush()
        await self._s.refresh(attempt)
        return attempt

    async def list_answers(self, attempt_id: UUID) -> list[AttemptAnswer]:
        r = await self._s.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id))
        return list(r.scalars().all())

    async def upsert_answer(
        self, attempt_id: UUID, question_id: UUID, selected_option_id: str | None
    ) -> AttemptAnswer:
        r = await self._s.execute(
            select(AttemptAnswer).where(
                AttemptAnswer.attempt_id == attempt_id,
                AttemptAnswer.question_id == question_id,
            )
        )
        row = r.scalar_one_or_none()
        if row:
            row.selected_option_id = selected_option_id
            await self._s.flush()
            await self._s.refresh(row)
            return row
        a = AttemptAnswer(attempt_id=attempt_id, question_id=question_id, selected_option_id=selected_option_id)
        self._s.add(a)
        await self._s.flush()
        await self._s.refresh(a)
        return a

    async def list_for_exam(self, exam_id: UUID, offset: int = 0, limit: int = 100) -> list[Attempt]:
        r = await self._s.execute(
            select(Attempt).where(Attempt.exam_id == exam_id).offset(offset).limit(limit)
        )
        return list(r.scalars().all())

    async def leaderboard_best_per_user(self, exam_id: UUID, limit: int = 100) -> list[tuple[int, float]]:
        r = await self._s.execute(
            select(Attempt.user_id, func.max(Attempt.score))
            .where(
                Attempt.exam_id == exam_id,
                Attempt.status == AttemptStatus.COMPLETED,
                Attempt.score.isnot(None),
            )
            .group_by(Attempt.user_id)
            .order_by(func.max(Attempt.score).desc())
            .limit(limit)
        )
        return [(int(uid), float(sc)) for uid, sc in r.all()]


class AttemptAnswerRepository:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def list_for_attempt(self, attempt_id: UUID) -> list[AttemptAnswer]:
        r = await self._s.execute(select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id))
        return list(r.scalars().all())
