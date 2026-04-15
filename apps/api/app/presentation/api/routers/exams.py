from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, HTTPException

from app.application.use_cases.exams import (
    create_exam,
    delete_exam,
    execute_for_student,
    execute_for_teacher,
    get_exam,
    list_exam_questions,
    set_exam_questions,
    update_exam,
)
from app.presentation.api.deps import CurrentUser, SessionDep, TeacherUser
from app.presentation.schemas.exams import ExamCreate, ExamOut, ExamQuestionsPut, ExamUpdate
from app.presentation.schemas.questions import QuestionOut

router = APIRouter(prefix="/exams", tags=["exams"])


@router.get("", response_model=list[ExamOut])
async def list_exams_route(session: SessionDep, user: CurrentUser):
    if user.quiz_role == "teacher":
        return await execute_for_teacher(session, user.id)
    return await execute_for_student(session, datetime.utcnow())


@router.post("", response_model=ExamOut)
async def create_exam_route(session: SessionDep, user: TeacherUser, body: ExamCreate):
    return await create_exam(body, session, user.id)


@router.get("/{exam_id}", response_model=ExamOut)
async def get_exam_route(session: SessionDep, user: CurrentUser, exam_id: UUID):
    ex = await get_exam(session, exam_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    if user.quiz_role == "student":
        if not ex.is_published:
            raise HTTPException(status_code=404, detail="Not found")
    return ex


@router.patch("/{exam_id}", response_model=ExamOut)
async def update_exam_route(session: SessionDep, user: TeacherUser, exam_id: UUID, body: ExamUpdate):
    ex = await update_exam(session, exam_id, body, user.id)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    return ex


@router.delete("/{exam_id}")
async def delete_exam_route(session: SessionDep, user: TeacherUser, exam_id: UUID):
    ok = await delete_exam(session, exam_id, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.get("/{exam_id}/questions", response_model=list[QuestionOut])
async def get_exam_questions_route(session: SessionDep, user: TeacherUser, exam_id: UUID):
    rows = await list_exam_questions(session, exam_id, user.id)
    if rows is None:
        raise HTTPException(status_code=404, detail="Not found")
    return rows


@router.put("/{exam_id}/questions")
async def put_exam_questions(session: SessionDep, user: TeacherUser, exam_id: UUID, body: ExamQuestionsPut):
    ok = await set_exam_questions(session, exam_id, body.question_ids, user.id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
