from uuid import UUID

from app.infrastructure.repositories.attempts import AttemptRepository


async def execute(session, exam_id: UUID):
    repo = AttemptRepository(session)
    return await repo.list_for_exam(exam_id)
