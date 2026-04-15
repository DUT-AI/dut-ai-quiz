from uuid import UUID

from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository


async def execute(session, exam_id: UUID, teacher_user_id: int):
    exam_repo = ExamRepository(session)
    ex = await exam_repo.get(exam_id)
    if not ex or ex.created_by != teacher_user_id:
        return None
    eq = ExamQuestionRepository(session)
    return await eq.load_questions_ordered(exam_id)
