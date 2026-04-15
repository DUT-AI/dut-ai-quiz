from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.questions import QuestionListQuery


async def execute(session, query: QuestionListQuery):
    repo = QuestionRepository(session)
    return await repo.list_all(
        pool_type=query.pool_type,
        difficulty=query.difficulty,
        tag=query.tag,
        offset=query.offset,
        limit=query.limit,
    )
