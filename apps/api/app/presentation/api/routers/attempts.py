from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.application.use_cases.attempts.focus_event import execute as focus_event_uc
from app.application.use_cases.attempts.get_attempt import execute as get_attempt_uc
from app.application.use_cases.attempts.get_attempt_detail import execute as get_attempt_detail_uc
from app.application.use_cases.attempts.list_exam_attempts import execute as list_exam_attempts_uc
from app.application.use_cases.attempts.patch_attempt_answers import execute as patch_answers_uc
from app.application.use_cases.attempts.start_attempt import execute as start_attempt_uc
from app.application.use_cases.attempts.submit_attempt import execute as submit_attempt_uc
from app.infrastructure.repositories.exams import ExamRepository
from app.presentation.api.deps import SessionDep, StudentUser, TeacherUser
from app.presentation.schemas.attempts import AttemptAnswersPatch, AttemptOut, StartAttemptOut
from app.presentation.schemas.common import FocusEventIn

router = APIRouter(tags=["attempts"])


@router.post("/exams/{exam_id}/attempts", response_model=StartAttemptOut)
async def start_attempt_route(session: SessionDep, user: StudentUser, exam_id: UUID):
    result, code = await start_attempt_uc(session, exam_id, user.id)
    if code == "not_found":
        raise HTTPException(status_code=404, detail="Exam not found")
    if code == "not_started":
        raise HTTPException(status_code=403, detail="Exam not started yet")
    if code == "ended":
        raise HTTPException(status_code=403, detail="Exam ended")
    if code == "max_attempts":
        raise HTTPException(status_code=403, detail="Max attempts reached")
    if code == "no_questions":
        raise HTTPException(status_code=400, detail="No questions in exam")
    att = result["attempt"]
    return StartAttemptOut(
        attempt_id=att.id,
        expires_at=att.expires_at,
        tab_out_count=att.tab_out_count,
        questions=result["presentation"],
    )


@router.get("/attempts/{attempt_id}")
async def get_attempt_route(session: SessionDep, user: StudentUser, attempt_id: UUID):
    data = await get_attempt_uc(session, attempt_id, user.id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    att = data["attempt"]
    return {
        "attempt": AttemptOut.model_validate(att),
        "questions": data["questions"],
    }


@router.patch("/attempts/{attempt_id}/answers")
async def patch_answers_route(
    session: SessionDep, user: StudentUser, attempt_id: UUID, body: AttemptAnswersPatch
):
    ok = await patch_answers_uc(session, attempt_id, user.id, body)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot save")
    return {"ok": True}


@router.post("/attempts/{attempt_id}/submit", response_model=AttemptOut)
async def submit_route(session: SessionDep, user: StudentUser, attempt_id: UUID):
    att, code = await submit_attempt_uc(session, attempt_id, user.id)
    if code == "not_found":
        raise HTTPException(status_code=404, detail="Not found")
    if code == "bad_state":
        raise HTTPException(status_code=400, detail="Invalid state")
    if att is None:
        raise HTTPException(status_code=400, detail="Submit failed")
    return AttemptOut.model_validate(att)


@router.post("/attempts/{attempt_id}/focus-events")
async def focus_events_route(session: SessionDep, user: StudentUser, attempt_id: UUID, body: FocusEventIn):
    out = await focus_event_uc(session, attempt_id, user.id, body)
    if out is None:
        raise HTTPException(status_code=400, detail="Invalid attempt")
    return out


@router.get("/exams/{exam_id}/attempts")
async def list_attempts_teacher(session: SessionDep, user: TeacherUser, exam_id: UUID):
    exam_repo = ExamRepository(session)
    ex = await exam_repo.get(exam_id)
    if not ex or ex.created_by != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    rows = await list_exam_attempts_uc(session, exam_id)
    return [AttemptOut.model_validate(a) for a in rows]


@router.get("/attempts/{attempt_id}/detail")
async def attempt_detail_teacher(session: SessionDep, user: TeacherUser, attempt_id: UUID):
    data = await get_attempt_detail_uc(session, attempt_id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    att = data["attempt"]
    exam_repo = ExamRepository(session)
    ex = await exam_repo.get(att.exam_id)
    if not ex or ex.created_by != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    return data
