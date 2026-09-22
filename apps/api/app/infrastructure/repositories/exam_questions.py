from uuid import UUID

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.question import QuestionEntity
from app.domain.interfaces import IExamQuestionRepository
from app.infrastructure.persistence.models import ExamQuestion, Question


class ExamQuestionRepository(IExamQuestionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def list_question_ids_ordered(self, exam_id: UUID) -> list[UUID]:
        r = await self._s.execute(
            select(ExamQuestion.question_id, ExamQuestion.position)
            .where(ExamQuestion.exam_id == exam_id)
            .order_by(ExamQuestion.position, ExamQuestion.id)
        )
        return [row[0] for row in r.all()]

    async def replace_all(self, exam_id: UUID, question_ids: list[UUID]) -> None:
        await self._s.execute(delete(ExamQuestion).where(ExamQuestion.exam_id == exam_id))
        for pos, qid in enumerate(question_ids):
            self._s.add(ExamQuestion(exam_id=exam_id, question_id=qid, position=pos))
        await self._s.flush()

    async def load_questions_ordered(self, exam_id: UUID) -> list[QuestionEntity]:
        ids = await self.list_question_ids_ordered(exam_id)
        if not ids:
            return []
        r = await self._s.execute(select(Question).where(Question.id.in_(ids)))
        by_id = {q.id: q.to_entity() for q in r.scalars().all()}
        return [by_id[i] for i in ids if i in by_id]
