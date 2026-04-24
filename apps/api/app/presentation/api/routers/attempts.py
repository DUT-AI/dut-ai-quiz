from uuid import UUID

from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.attempts.attempt_use_case import (
    StartAttemptUseCase,
    SubmitAttemptUseCase,
    GetAttemptUseCase,
    GetAttemptDetailUseCase,
    ListExamAttemptsUseCase,
    PatchAttemptAnswersUseCase,
    RecordFocusEventUseCase,
    ReviewAttemptUseCase,
)
from app.application.use_cases.exams.exam_use_case import GetExamUseCase
from app.presentation.api.deps import StudentUser, TeacherUser, CurrentUser
from app.presentation.schemas.attempts import (
    AttemptAnswersPatch,
    AttemptOut,
    StartAttemptOut,
    AttemptAnswerOut,
)
from app.presentation.schemas.questions import QuestionOut
from app.presentation.schemas.common import FocusEventIn

router = APIRouter(tags=["attempts"])


@router.post("/exams/{exam_id}/attempts", response_model=StartAttemptOut)
@inject
async def start_attempt_route(
    user: CurrentUser,
    exam_id: UUID,
    use_case: FromDishka[StartAttemptUseCase],
):
    result, code = await use_case.execute(exam_id, user.id)
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
@inject
async def get_attempt_route(
    user: CurrentUser,
    attempt_id: UUID,
    use_case: FromDishka[GetAttemptUseCase],
):
    data = await use_case.execute(attempt_id, user.id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    att = data["attempt"]
    return {
        "attempt": AttemptOut.model_validate(att),
        "questions": data["questions"],
        "saved_answers": [
            {"question_id": str(a.question_id), "selected_option_id": a.selected_option_id}
            for a in data.get("saved_answers", [])
        ],
    }


@router.patch("/attempts/{attempt_id}/answers")
@inject
async def patch_answers_route(
    user: CurrentUser,
    attempt_id: UUID,
    body: AttemptAnswersPatch,
    use_case: FromDishka[PatchAttemptAnswersUseCase],
):
    ok = await use_case.execute(attempt_id, user.id, body)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot save")
    return {"ok": True}


@router.post("/attempts/{attempt_id}/submit", response_model=AttemptOut)
@inject
async def submit_route(
    user: CurrentUser,
    attempt_id: UUID,
    use_case: FromDishka[SubmitAttemptUseCase],
):
    att, code = await use_case.execute(attempt_id, user.id)
    if code == "not_found":
        raise HTTPException(status_code=404, detail="Not found")
    if code == "bad_state":
        raise HTTPException(status_code=400, detail="Invalid state")
    if att is None:
        raise HTTPException(status_code=400, detail="Submit failed")
    return AttemptOut.model_validate(att)


@router.post("/attempts/{attempt_id}/focus-events")
@inject
async def focus_events_route(
    user: CurrentUser,
    attempt_id: UUID,
    body: FocusEventIn,
    use_case: FromDishka[RecordFocusEventUseCase],
):
    out = await use_case.execute(attempt_id, user.id, body)
    if out is None:
        raise HTTPException(status_code=400, detail="Invalid attempt")
    return out


@router.get("/exams/{exam_id}/attempts")
@inject
async def list_attempts_teacher(
    user: TeacherUser,
    exam_id: UUID,
    get_exam: FromDishka[GetExamUseCase],
    use_case: FromDishka[ListExamAttemptsUseCase],
):
    ex = await get_exam.execute(exam_id)
    if not ex or ex.created_by != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    rows = await use_case.execute(exam_id)
    return [AttemptOut.model_validate(a) for a in rows]


@router.get("/attempts/{attempt_id}/detail")
@inject
async def attempt_detail_teacher(
    user: TeacherUser,
    attempt_id: UUID,
    get_exam: FromDishka[GetExamUseCase],
    use_case: FromDishka[GetAttemptDetailUseCase],
):
    data = await use_case.execute(attempt_id)
    if not data:
        raise HTTPException(status_code=404, detail="Not found")
    att = data["attempt"]
    ex = await get_exam.execute(att.exam_id)
    if not ex or ex.created_by != user.id:
        raise HTTPException(status_code=404, detail="Not found")
    return data


@router.get("/attempts/{attempt_id}/review")
@inject
async def review_attempt_student(
    user: CurrentUser,
    attempt_id: UUID,
    use_case: FromDishka[ReviewAttemptUseCase],
):
    result = await use_case.execute(attempt_id, user.id)

    # Handle tuple return (None, "review_locked")
    if isinstance(result, tuple):
        _, code = result
        if code == "review_locked":
            raise HTTPException(
                status_code=403,
                detail="Chưa đến thời gian xem đáp án. Vui lòng chờ đến khi kỳ thi kết thúc.",
            )

    if not result:
        raise HTTPException(status_code=404, detail="Not found or not completed")

    data = result
    return {
        "attempt": AttemptOut.model_validate(data["attempt"]),
        "answers": [AttemptAnswerOut.model_validate(a) for a in data["answers"]],
        "questions": [QuestionOut.model_validate(q) for q in data["questions"]]
    }
