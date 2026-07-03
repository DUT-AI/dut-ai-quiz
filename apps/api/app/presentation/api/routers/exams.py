from uuid import UUID

from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.exams.exam_use_case import (
    CreateExamUseCase,
    DeleteExamUseCase,
    GetExamUseCase,
    ListExamQuestionsUseCase,
    ListExamsUseCase,
    SetExamQuestionsUseCase,
    UpdateExamUseCase,
)
from app.application.use_cases.exams.stats_use_case import GetExamStatsUseCase
from app.presentation.api.deps import CurrentUser, TeacherUser
from app.core.datetime_utils import now_ict
from app.presentation.schemas.exams import (
    ExamCreate,
    ExamOut,
    ExamQuestionsPut,
    ExamUpdate,
)
from app.presentation.schemas.stats import ExamStatsOut
from app.presentation.schemas.questions import QuestionOut

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("", response_model=list[ExamOut])
@inject
async def list_exams_route(
    user: CurrentUser, use_case: FromDishka[ListExamsUseCase]
):
    if user.quiz_role in ("admin", "MENTOR"):
        return await use_case.execute_for_teacher(user.id)
    return await use_case.execute_for_student(user.id, now_ict())


@router.post("", response_model=ExamOut)
@inject
async def create_exam_route(
    user: TeacherUser, body: ExamCreate, use_case: FromDishka[CreateExamUseCase]
):
    return await use_case.execute(body, user.id)


@router.get("/{exam_id}", response_model=ExamOut)
@inject
async def get_exam_route(
    user: CurrentUser, exam_id: UUID, use_case: FromDishka[GetExamUseCase]
):
    ex = await use_case.execute(exam_id, user_id=user.id, role=user.quiz_role)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    if user.quiz_role not in ("admin", "MENTOR"):
        if not ex.is_published:
            raise HTTPException(status_code=404, detail="Not found")
    return ex


@router.patch("/{exam_id}", response_model=ExamOut)
@inject
async def update_exam_route(
    user: TeacherUser,
    exam_id: UUID,
    body: ExamUpdate,
    use_case: FromDishka[UpdateExamUseCase],
):
    ex = await use_case.execute(exam_id, body, user.id)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    return ex


@router.delete("/{exam_id}")
@inject
async def delete_exam_route(
    user: TeacherUser, exam_id: UUID, use_case: FromDishka[DeleteExamUseCase]
):
    ok = await use_case.execute(exam_id, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.get("/{exam_id}/questions", response_model=list[QuestionOut])
@inject
async def get_exam_questions_route(
    user: TeacherUser, exam_id: UUID, use_case: FromDishka[ListExamQuestionsUseCase]
):
    rows = await use_case.execute(exam_id, user.id)
    if rows is None:
        raise HTTPException(status_code=404, detail="Not found")
    return rows


@router.put("/{exam_id}/questions")
@inject
async def put_exam_questions(
    user: TeacherUser,
    exam_id: UUID,
    body: ExamQuestionsPut,
    use_case: FromDishka[SetExamQuestionsUseCase],
):
    ok = await use_case.execute(exam_id, body.question_ids, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.get("/{exam_id}/stats", response_model=ExamStatsOut)
@inject
async def get_exam_stats_route(
    user: TeacherUser,
    exam_id: UUID,
    use_case: FromDishka[GetExamStatsUseCase],
):
    stats = await use_case.execute(exam_id)
    return stats
