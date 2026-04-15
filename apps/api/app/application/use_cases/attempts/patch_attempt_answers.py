from uuid import UUID

from app.infrastructure.repositories.attempts import AttemptRepository
from app.presentation.schemas.attempts import AttemptAnswersPatch


async def execute(session, attempt_id: UUID, user_id: int, body: AttemptAnswersPatch) -> bool:
    repo = AttemptRepository(session)
    att = await repo.get(attempt_id)
    if not att or att.user_id != user_id:
        return False
    from app.infrastructure.persistence.models import AttemptStatus

    if att.status != AttemptStatus.IN_PROGRESS:
        return False
    for a in body.answers:
        await repo.upsert_answer(attempt_id, a.question_id, a.selected_option_id)
    return True
