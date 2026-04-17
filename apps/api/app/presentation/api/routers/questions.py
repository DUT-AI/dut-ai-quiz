from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.questions.question_use_case import (
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    GetQuestionUseCase,
    ListQuestionsUseCase,
    UpdateQuestionUseCase,
    BulkCreateQuestionsUseCase,
)
from app.infrastructure.persistence.models import PoolType
from app.presentation.api.deps import TeacherUser, CurrentUser
from app.presentation.schemas.questions import (
    QuestionCreate,
    QuestionListQuery,
    QuestionOut,
    QuestionUpdate,
    QuestionBulkCreate,
)

router = APIRouter(prefix="/questions", tags=["questions"])


@router.get("", response_model=list[QuestionOut])
@inject
async def list_questions_route(
    user: CurrentUser,
    use_case: FromDishka[ListQuestionsUseCase],
    pool_type: PoolType | None = None,
    lesson_id: UUID | None = None,
    tag: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    # For students, we only allow viewing PRACTICE questions
    if user.quiz_role != "teacher":
        pool_type = PoolType.PRACTICE

    q = QuestionListQuery(
        pool_type=pool_type,
        lesson_id=lesson_id,
        tag=tag,
        offset=offset,
        limit=limit,
    )
    rows = await use_case.execute(q)
    return rows


@router.post("", response_model=QuestionOut)
@inject
async def create_question_route(
    user: TeacherUser, body: QuestionCreate, use_case: FromDishka[CreateQuestionUseCase]
):
    return await use_case.execute(body)


@router.get("/{question_id}", response_model=QuestionOut)
@inject
async def get_question_route(
    user: TeacherUser, question_id: UUID, use_case: FromDishka[GetQuestionUseCase]
):
    q = await use_case.execute(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.patch("/{question_id}", response_model=QuestionOut)
@inject
async def update_question_route(
    user: TeacherUser,
    question_id: UUID,
    body: QuestionUpdate,
    use_case: FromDishka[UpdateQuestionUseCase],
):
    q = await use_case.execute(question_id, body)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.delete("/{question_id}")
@inject
async def delete_question_route(
    user: TeacherUser, question_id: UUID, use_case: FromDishka[DeleteQuestionUseCase]
):
    ok = await use_case.execute(question_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.post("/bulk", response_model=list[QuestionOut])
@inject
async def bulk_create_questions_route(
    user: TeacherUser, 
    body: QuestionBulkCreate, 
    use_case: FromDishka[BulkCreateQuestionsUseCase]
):
    return await use_case.execute(body)
