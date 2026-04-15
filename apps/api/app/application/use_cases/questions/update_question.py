from uuid import UUID

from app.infrastructure.persistence.models import Question
from app.infrastructure.repositories.questions import QuestionRepository
from app.presentation.schemas.questions import QuestionUpdate


async def execute(session, question_id: UUID, payload: QuestionUpdate) -> Question | None:
    repo = QuestionRepository(session)
    q = await repo.get(question_id)
    if not q:
        return None
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(q, k, v)
    await session.flush()
    await session.refresh(q)
    return q
