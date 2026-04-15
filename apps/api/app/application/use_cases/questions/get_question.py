from uuid import UUID

from app.infrastructure.repositories.questions import QuestionRepository


async def execute(session, question_id: UUID):
    repo = QuestionRepository(session)
    return await repo.get(question_id)
