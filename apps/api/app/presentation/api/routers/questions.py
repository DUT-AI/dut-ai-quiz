from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, Query
from pydantic import BaseModel

from app.application.use_cases.questions import (
    AiRegenerateSolutionUseCase,
    AnswerQuestionUseCase,
    BulkCreateQuestionsUseCase,
    CreateQuestionUseCase,
    DeleteQuestionUseCase,
    FindRelatedQuestionsUseCase,
    GetQuestionUseCase,
    GetRelatedLessonsUseCase,
    HeartbeatQuestionUseCase,
    ListQuestionsUseCase,
    PublishQuestionUseCase,
    UpdateQuestionUseCase,
)
from app.config import settings
from app.domain.entities.auth_enums import SystemPermission
from app.domain.entities.question import QuestionStatus
from app.domain.interfaces import EmbeddingServiceError
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.api.deps import CurrentUser, EducatorUser
from app.presentation.schemas.lessons import RelatedLessonOut
from app.presentation.schemas.questions import (
    QuestionAnswerIn,
    QuestionAnswerOut,
    QuestionBulkCreate,
    QuestionCreate,
    QuestionListQuery,
    QuestionOut,
    QuestionToStudent,
    QuestionUpdate,
    RelatedQuestionOut,
    RelatedQuestionsIn,
)


class AiRegenerateRequest(BaseModel):
    custom_prompt: str | None = None


router = APIRouter(prefix="/questions", tags=["questions"])


def sanitize_questions_for_student(questions: list) -> list:
    return [QuestionToStudent.model_validate(q) for q in questions]


@router.get("", response_model=list[QuestionOut])
@inject
async def list_questions_route(
    user: CurrentUser,
    use_case: FromDishka[ListQuestionsUseCase],
    pool_type: PoolType | None = None,
    difficulty: Difficulty | None = None,
    lesson_id: UUID | None = None,
    tag: str | None = None,
    import_session_id: UUID | None = None,
    status: QuestionStatus | None = None,
    related_questions: bool | None = Query(None),
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=2000),
):
    # For guests/students, we only allow viewing PUBLIC questions.
    if not user.has_permission(SystemPermission.MANAGE_QUESTION):
        pool_type = PoolType.PRACTICE
        status = QuestionStatus.PUBLIC
    elif status is None:
        status = QuestionStatus.PUBLIC

    q = QuestionListQuery(
        pool_type=pool_type,
        difficulty=difficulty,
        lesson_id=lesson_id,
        tag=tag,
        import_session_id=import_session_id,
        status=status,
        related_questions=related_questions,
        offset=offset,
        limit=limit,
    )
    rows = await use_case.execute(q)
    if not user.has_permission(SystemPermission.MANAGE_QUESTION):
        rows = sanitize_questions_for_student(rows)
    return rows


@router.post("", response_model=QuestionOut)
@inject
async def create_question_route(
    user: EducatorUser,
    body: QuestionCreate,
    use_case: FromDishka[CreateQuestionUseCase],
):
    body.created_by = user.id
    return await use_case.execute(body)


@router.post("/related", response_model=list[RelatedQuestionOut])
@inject
async def find_related_questions_route(
    user: CurrentUser,
    body: RelatedQuestionsIn,
    use_case: FromDishka[FindRelatedQuestionsUseCase],
):
    pool_type = body.pool_type
    if not user.has_permission(SystemPermission.MANAGE_QUESTION):
        pool_type = PoolType.PRACTICE

    try:
        return await use_case.execute(
            content=body.content,
            limit=body.limit,
            min_score=(
                settings.related_question_min_score if body.min_score is None else body.min_score
            ),
            pool_type=pool_type,
        )
    except EmbeddingServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.get("/{question_id}", response_model=QuestionOut)
@inject
async def get_question_route(
    user: EducatorUser,
    question_id: UUID,
    use_case: FromDishka[GetQuestionUseCase],
):
    q = await use_case.execute(question_id)
    if not q:
        raise HTTPException(status_code=404, detail="Not found")
    return q


@router.patch("/{question_id}", response_model=QuestionOut)
@inject
async def update_question_route(
    user: EducatorUser,
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
    user: EducatorUser,
    question_id: UUID,
    use_case: FromDishka[DeleteQuestionUseCase],
):
    ok = await use_case.execute(question_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Not found")
    return {"ok": True}


@router.post("/bulk", response_model=list[QuestionOut])
@inject
async def bulk_create_questions_route(
    user: EducatorUser,
    body: QuestionBulkCreate,
    use_case: FromDishka[BulkCreateQuestionsUseCase],
):
    body.created_by = user.id
    return await use_case.execute(body)


@router.post("/{question_id}/answer", response_model=QuestionAnswerOut)
@inject
async def answer_question_route(
    user: CurrentUser,
    question_id: UUID,
    body: QuestionAnswerIn,
    use_case: FromDishka[AnswerQuestionUseCase],
):
    result = await use_case.execute(question_id, body.option_id)
    if result is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return result


@router.get("/{question_id}/related-lessons", response_model=list[RelatedLessonOut])
@inject
async def get_related_lessons_route(
    user: CurrentUser,
    question_id: UUID,
    use_case: FromDishka[GetRelatedLessonsUseCase],
    limit: int = Query(3, ge=1, le=10),
    min_score: float | None = Query(None, ge=-1, le=1),
):
    try:
        result = await use_case.execute(
            question_id,
            limit=limit,
            min_score=(settings.related_lesson_min_score if min_score is None else min_score),
        )
    except EmbeddingServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Question not found")
    return result


@router.post("/{question_id}/heartbeat")
@inject
async def heartbeat_question_route(
    user: EducatorUser,
    question_id: UUID,
    use_case: FromDishka[HeartbeatQuestionUseCase],
):
    ok = await use_case.execute(question_id, user.id)
    if not ok:
        raise HTTPException(
            status_code=409, detail="Could not acquire lock or question not found/not draft."
        )
    return {"ok": True}


@router.post("/{question_id}/ai-regenerate", response_model=QuestionOut)
@inject
async def ai_regenerate_route(
    user: EducatorUser,
    question_id: UUID,
    body: AiRegenerateRequest,
    use_case: FromDishka[AiRegenerateSolutionUseCase],
):
    # Depending on requirements, we can also check the lock here before allowing regenerate.
    q = await use_case.execute(question_id, body.custom_prompt)
    if not q:
        raise HTTPException(status_code=404, detail="Not found or not draft")
    return q


@router.put("/{question_id}/publish", response_model=QuestionOut)
@inject
async def publish_question_route(
    user: EducatorUser,
    question_id: UUID,
    use_case: FromDishka[PublishQuestionUseCase],
):
    try:
        q = await use_case.execute(question_id, user.id)
        if not q:
            raise HTTPException(status_code=404, detail="Not found or not draft")
        return q
    except ValueError as e:
        raise HTTPException(status_code=409, detail=str(e))
