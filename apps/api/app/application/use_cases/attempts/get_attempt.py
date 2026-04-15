from uuid import UUID

from app.application.services.shuffle import presentation_from_snapshot
from app.infrastructure.repositories.attempts import AttemptRepository


async def execute(session, attempt_id: UUID, user_id: int) -> dict | None:
    att_repo = AttemptRepository(session)
    att = await att_repo.get(attempt_id)
    if not att or att.user_id != user_id:
        return None
    if not att.shuffle_snapshot:
        return {"attempt": att, "questions": []}
    ids = [UUID(x) for x in att.shuffle_snapshot.get("question_order", [])]
    if not ids:
        return {"attempt": att, "questions": []}
    from sqlalchemy import select

    from app.infrastructure.persistence.models import Question

    r = await session.execute(select(Question).where(Question.id.in_(ids)))
    by_id = {q.id: q for q in r.scalars().all()}
    ordered = [by_id[i] for i in ids if i in by_id]
    questions = presentation_from_snapshot({q.id: q for q in ordered}, att.shuffle_snapshot)
    return {"attempt": att, "questions": questions}
