from uuid import UUID

from app.infrastructure.repositories.questions import QuestionRepository


async def execute(session, question_id: UUID) -> bool:
    repo = QuestionRepository(session)
    q = await repo.get(question_id)
    if not q:
        return False
    await repo.delete(q)
    return True
