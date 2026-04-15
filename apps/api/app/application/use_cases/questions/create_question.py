from app.infrastructure.persistence.models import Question
from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.questions import QuestionCreate


async def execute(payload: QuestionCreate, session) -> Question:
    repo = QuestionRepository(session)
    q = Question(
        pool_type=payload.pool_type,
        content=payload.content,
        options=payload.options,
        solution=payload.solution,
        difficulty=payload.difficulty,
        tags=payload.tags,
    )
    return await repo.add(q)
