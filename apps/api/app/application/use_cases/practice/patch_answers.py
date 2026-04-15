from uuid import UUID

from app.infrastructure.persistence.models import PracticeSessionStatus
from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository
from app.presentation.schemas.attempts import AttemptAnswersPatch


async def execute(session, session_id: UUID, user_id: int, body: AttemptAnswersPatch) -> bool:
    repo = PracticeSessionRepository(session)
    row = await repo.get(session_id)
    if not row or row.user_id != user_id:
        return False
    if row.status != PracticeSessionStatus.IN_PROGRESS:
        return False
    snap = dict(row.snapshot or {})
    ans = dict(snap.get("answers") or {})
    for a in body.answers:
        ans[str(a.question_id)] = a.selected_option_id
    snap["answers"] = ans
    row.snapshot = snap
    await repo.save(row)
    return True
