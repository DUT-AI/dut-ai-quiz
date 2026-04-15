from uuid import UUID

from app.infrastructure.repositories.exams import ExamRepository


async def execute(session, exam_id: UUID, teacher_user_id: int) -> bool:
    repo = ExamRepository(session)
    ex = await repo.get(exam_id)
    if not ex or ex.created_by != teacher_user_id:
        return False
    await repo.delete(ex)
    return True
