from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.attempt import AttemptAnswerEntity, AttemptEntity
from app.domain.interfaces import IAttemptAnswerRepository, IAttemptRepository
from app.domain.value_objects import AttemptStatus
from app.infrastructure.persistence.models import Attempt, AttemptAnswer, Exam


class AttemptRepository(IAttemptRepository):
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

    async def get(self, attempt_id: UUID) -> AttemptEntity | None:
        r = await self._s.execute(select(Attempt).where(Attempt.id == attempt_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def add(self, entity: AttemptEntity) -> AttemptEntity:
        model = Attempt.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def save(self, entity: AttemptEntity) -> AttemptEntity:
        r = await self._s.execute(select(Attempt).where(Attempt.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.exam_id = entity.exam_id
            model.user_id = entity.user_id
            model.started_at = entity.started_at
            model.completed_at = entity.completed_at
            model.expires_at = entity.expires_at
            model.score = entity.score
            model.status = entity.status
            model.tab_out_count = entity.tab_out_count
            model.shuffle_seed = entity.shuffle_seed
            model.shuffle_snapshot = (
                entity.shuffle_snapshot.to_dict() if entity.shuffle_snapshot else None
            )
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Attempt not found")

    async def list_answers(self, attempt_id: UUID) -> list[AttemptAnswerEntity]:
        r = await self._s.execute(
            select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def upsert_answer(
        self, attempt_id: UUID, question_id: UUID, selected_option_id: str | None
    ) -> AttemptAnswerEntity:
        r = await self._s.execute(
            select(AttemptAnswer).where(
                AttemptAnswer.attempt_id == attempt_id,
                AttemptAnswer.question_id == question_id,
            )
        )
        model = r.scalar_one_or_none()
        if model:
            model.selected_option_id = selected_option_id
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()

        from uuid import uuid4

        a = AttemptAnswer(
            id=uuid4(),
            attempt_id=attempt_id,
            question_id=question_id,
            selected_option_id=selected_option_id,
        )
        self._s.add(a)
        await self._s.flush()
        await self._s.refresh(a)
        return a.to_entity()

    async def list_for_exam(
        self, exam_id: UUID, offset: int = 0, limit: int = 100
    ) -> list[AttemptEntity]:
        r = await self._s.execute(
            select(Attempt)
            .where(Attempt.exam_id == exam_id)
            .offset(offset)
            .limit(limit)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_all_for_exam(self, exam_id: UUID) -> list[AttemptEntity]:
        r = await self._s.execute(
            select(Attempt)
            .where(Attempt.exam_id == exam_id)
            .order_by(Attempt.started_at)
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def list_for_user(self, user_id: int) -> list[tuple[AttemptEntity, str]]:

        r = await self._s.execute(
            select(Attempt, Exam.title)
            .join(Exam, Attempt.exam_id == Exam.id)
            .where(Attempt.user_id == user_id)
            .order_by(Attempt.started_at.desc())
        )
        return [(row[0].to_entity(), str(row[1])) for row in r.all()]

    async def leaderboard_best_per_user(
        self, exam_id: UUID, limit: int = 100
    ) -> list[tuple[int, float]]:
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

    async def list_completed_ids_by_question_id(self, question_id: UUID) -> list[UUID]:
        r = await self._s.execute(
            select(Attempt.id)
            .join(AttemptAnswer, Attempt.id == AttemptAnswer.attempt_id)
            .where(
                AttemptAnswer.question_id == question_id,
                Attempt.status == AttemptStatus.COMPLETED,
            )
            .distinct()
        )
        return [UUID(str(row)) for row in r.scalars().all()]

    async def list_all_answers_for_exam(
        self, exam_id: UUID
    ) -> list[AttemptAnswerEntity]:
        r = await self._s.execute(
            select(AttemptAnswer)
            .join(Attempt, Attempt.id == AttemptAnswer.attempt_id)
            .where(
                Attempt.exam_id == exam_id, Attempt.status == AttemptStatus.COMPLETED
            )
        )
        return [m.to_entity() for m in r.scalars().all()]


class AttemptAnswerRepository(IAttemptAnswerRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def list_for_attempt(self, attempt_id: UUID) -> list[AttemptAnswerEntity]:
        r = await self._s.execute(
            select(AttemptAnswer).where(AttemptAnswer.attempt_id == attempt_id)
        )
        return [m.to_entity() for m in r.scalars().all()]
