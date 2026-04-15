from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.application.use_cases.practice.finish_session import execute as finish_practice_uc
from app.application.use_cases.practice.get_session import execute as get_practice_uc
from app.application.use_cases.practice.list_history import execute as list_history_uc
from app.application.use_cases.practice.patch_answers import execute as patch_practice_uc
from app.application.use_cases.practice.start_session import execute as start_practice_uc
from app.presentation.api.deps import SessionDep, StudentUser
from app.presentation.schemas.attempts import AttemptAnswersPatch
from app.presentation.schemas.exams import PracticeStartIn

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/sessions")
async def start_practice(session: SessionDep, user: StudentUser, body: PracticeStartIn):
    row, code = await start_practice_uc(session, user.id, body.tags, body.difficulty, body.limit)
    if code == "empty":
        raise HTTPException(status_code=400, detail="No practice questions")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/{session_id}")
async def get_practice(session: SessionDep, user: StudentUser, session_id: UUID):
    row = await get_practice_uc(session, session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.patch("/sessions/{session_id}/answers")
async def patch_practice(session: SessionDep, user: StudentUser, session_id: UUID, body: AttemptAnswersPatch):
    ok = await patch_practice_uc(session, session_id, user.id, body)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot save")
    return {"ok": True}


@router.post("/sessions/{session_id}/finish")
async def finish_practice(session: SessionDep, user: StudentUser, session_id: UUID):
    row = await finish_practice_uc(session, session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.get("/history")
async def practice_history(session: SessionDep, user: StudentUser):
    return await list_history_uc(session, user.id)
