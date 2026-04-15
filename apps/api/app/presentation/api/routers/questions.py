from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.application.use_cases.questions import create_question, delete_question, get_question, list_questions, update_question
from app.infrastructure.persistence.models import Difficulty, PoolType
from app.presentation.api.deps import SessionDep, TeacherUser
from app.presentation.schemas.questions import QuestionCreate, QuestionListQuery, QuestionOut, QuestionUpdate

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
async def list_questions_route(
    session: SessionDep,
    user: TeacherUser,
    pool_type: PoolType | None = None,
    difficulty: Difficulty | None = None,
    tag: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    q = QuestionListQuery(pool_type=pool_type, difficulty=difficulty, tag=tag, offset=offset, limit=limit)
    rows = await list_questions(session, q)
    return rows


@router.post("", response_model=QuestionOut)
async def create_question_route(session: SessionDep, user: TeacherUser, body: QuestionCreate):
    return await create_question(body, session)


@router.get("/{question_id}", response_model=QuestionOut)
async def get_question_route(session: SessionDep, user: TeacherUser, question_id: UUID):
    q = await get_question(session, question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.patch("/{question_id}", response_model=QuestionOut)
async def update_question_route(session: SessionDep, user: TeacherUser, question_id: UUID, body: QuestionUpdate):
    q = await update_question(session, question_id, body)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.delete("/{question_id}")
async def delete_question_route(session: SessionDep, user: TeacherUser, question_id: UUID):
    ok = await delete_question(session, question_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}
