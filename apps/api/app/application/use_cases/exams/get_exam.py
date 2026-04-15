from uuid import UUID

from app.infrastructure.repositories.exams import ExamRepository


async def execute(session, exam_id: UUID):
    repo = ExamRepository(session)
    return await repo.get(exam_id)
