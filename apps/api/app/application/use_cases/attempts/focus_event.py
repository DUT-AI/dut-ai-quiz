from datetime import datetime
from uuid import UUID

from app.infrastructure.persistence.models import AttemptStatus, FocusEvent
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.presentation.schemas.common import FocusEventIn


async def execute(session, attempt_id: UUID, user_id: int, body: FocusEventIn) -> dict | None:
    att_repo = AttemptRepository(session)
    fe_repo = FocusEventRepository(session)
    att = await att_repo.get(attempt_id)
    if not att or att.user_id != user_id:
        return None
    if att.status != AttemptStatus.IN_PROGRESS:
        return None
    if datetime.utcnow() > att.expires_at:
        return None
    if body.event != "visibility_hidden":
        return {"tab_out_count": att.tab_out_count, "action": "IGNORED"}

    exists = await fe_repo.exists(attempt_id, body.client_event_id)
    if exists:
        return {"tab_out_count": att.tab_out_count, "action": "IGNORED"}

    await fe_repo.add(
        FocusEvent(attempt_id=attempt_id, client_event_id=body.client_event_id, event=body.event)
    )
    att.tab_out_count += 1
    await att_repo.save(att)

    if att.tab_out_count >= 2:
        from app.application.use_cases.attempts.submit_attempt import execute as submit_execute

        _sub, st = await submit_execute(session, attempt_id, user_id)
        if st in ("ok", "already_done"):
            a = await att_repo.get(attempt_id)
            return {
                "tab_out_count": att.tab_out_count,
                "action": "AUTO_SUBMITTED",
                "attempt": {
                    "status": a.status.value if a else None,
                    "score": float(a.score) if a and a.score is not None else None,
                    "completed_at": a.completed_at.isoformat() if a and a.completed_at else None,
                },
            }
    return {"tab_out_count": att.tab_out_count, "action": "WARN"}
