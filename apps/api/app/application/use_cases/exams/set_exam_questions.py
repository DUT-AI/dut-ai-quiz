from uuid import UUID

from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository


async def execute(session, exam_id: UUID, question_ids: list[UUID], teacher_user_id: int) -> bool:
    exam_repo = ExamRepository(session)
    ex = await exam_repo.get(exam_id)
    if not ex or ex.created_by != teacher_user_id:
        return False
    eq = ExamQuestionRepository(session)
    await eq.replace_all(exam_id, question_ids)
    return True
