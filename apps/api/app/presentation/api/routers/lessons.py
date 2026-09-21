from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, File, Form, HTTPException, Query, UploadFile

from app.application.use_cases.lessons import (
    CreateLessonUseCase,
    DeleteLessonUseCase,
    GetLessonBySlugUseCase,
    GetLessonDetailUseCase,
    ImportNotionLessonUseCase,
    IndexLessonUseCase,
    ListLessonsUseCase,
    ReorderLessonsUseCase,
    UpdateLessonUseCase,
)
from app.application.use_cases.questions import ListQuestionsUseCase
from app.domain.entities.auth_enums import SystemPermission
from app.domain.interfaces import EmbeddingServiceError
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.api.deps import CurrentUser, EducatorUser
from app.presentation.schemas.lessons import (
    LessonCreate,
    LessonDetailOut,
    LessonIndexOut,
    LessonOut,
    LessonReorder,
    LessonUpdate,
)
from app.presentation.schemas.questions import QuestionListQuery, QuestionOut, QuestionToStudent

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonOut])
@inject
async def list_lessons(
    user: CurrentUser,
    use_case: FromDishka[ListLessonsUseCase],
):
    return await use_case.execute()


@router.get("/by-slug/{slug}", response_model=LessonDetailOut)
@inject
async def get_lesson_by_slug(
    slug: str,
    user: CurrentUser,
    use_case: FromDishka[GetLessonBySlugUseCase],
):
    """
    Get lesson by slug.
    Requires authentication via Bearer Token, Cookie, or Third-party API Key (X-API-Key / ?api_key=).
    """
    res = await use_case.execute(slug)
    if not res:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return res


@router.get("/{lesson_id}/questions", response_model=list[QuestionOut])
@inject
async def list_lesson_questions(
    lesson_id: UUID,
    user: CurrentUser,
    use_case: FromDishka[ListQuestionsUseCase],
    pool_type: PoolType | None = None,
    difficulty: Difficulty | None = None,
    tag: str | None = None,
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
):
    # Learners and third-parties only see practice questions. Educators/Admins can filter both PRACTICE and EXAM.
    is_teacher = user.has_permission(SystemPermission.MANAGE_LESSON)
    if not is_teacher:
        pool_type = PoolType.PRACTICE

    query = QuestionListQuery(
        pool_type=pool_type,
        difficulty=difficulty,
        lesson_id=lesson_id,
        tag=tag,
        offset=offset,
        limit=limit,
    )
    rows = await use_case.execute(query)
    if not is_teacher:
        rows = [QuestionToStudent.model_validate(q) for q in rows]
    return rows


@router.get("/{lesson_id}", response_model=LessonDetailOut)
@inject
async def get_lesson(
    lesson_id: str,
    user: CurrentUser,
    use_case: FromDishka[GetLessonDetailUseCase],
):
    is_teacher = user.has_permission(SystemPermission.MANAGE_LESSON)
    res = await use_case.execute(lesson_id, is_teacher=is_teacher)
    if not res:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not is_teacher:
        import copy
        res = copy.deepcopy(res)
        res["questions"] = [QuestionToStudent.model_validate(q) for q in res.get("questions", [])]
    return res


@router.post("", response_model=LessonOut)
@inject
async def create_lesson(
    user: EducatorUser,
    body: LessonCreate,
    use_case: FromDishka[CreateLessonUseCase],
):
    return await use_case.execute(body)


@router.post("/import-notion", response_model=LessonOut)
@inject
async def import_notion_lesson(
    user: EducatorUser,
    use_case: FromDishka[ImportNotionLessonUseCase],
    file: UploadFile = File(..., description="ZIP file exported from Notion containing markdown and images"),
    module_id: str | None = Form(None),
    name: str | None = Form(None),
    description: str | None = Form(None),
    lesson_id: str | None = Form(None),
):
    """
    Import a lesson from a ZIP file containing Markdown and images exported from Notion.
    Educator or Admin only.
    """
    if file.filename and not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files (.zip) are supported")

    mid = None
    if module_id and module_id.strip() and module_id.strip().lower() not in ("null", "undefined", "none", "string"):
        try:
            mid = UUID(module_id.strip())
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid module_id UUID format: {module_id}",
            ) from e

    lid = None
    if lesson_id and lesson_id.strip() and lesson_id.strip().lower() not in ("null", "undefined", "none", "string"):
        try:
            lid = UUID(lesson_id.strip())
        except ValueError as e:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid lesson_id UUID format: {lesson_id}",
            ) from e

    try:
        zip_bytes = await file.read()
        res = await use_case.execute(
            zip_bytes=zip_bytes,
            module_id=mid,
            custom_name=name,
            custom_description=description,
            lesson_id=lid,
        )
        return res
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to import lesson: {str(e)}"
        ) from e



@router.post("/reorder")
@inject
async def reorder_lessons(
    user: EducatorUser,
    body: LessonReorder,
    use_case: FromDishka[ReorderLessonsUseCase],
):
    """Reorder lessons in the system. Educator or Admin only."""
    await use_case.execute(body)
    return {"ok": True}


@router.patch("/{lesson_id}", response_model=LessonOut)
@inject
async def update_lesson(
    user: EducatorUser,
    lesson_id: str,
    body: LessonUpdate,
    use_case: FromDishka[UpdateLessonUseCase],
):
    res = await use_case.execute(lesson_id, body)
    if not res:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return res


@router.post(
    "/{lesson_id}/embeddings/reindex", response_model=LessonIndexOut
)
@inject
async def reindex_lesson(
    user: EducatorUser,
    lesson_id: UUID,
    use_case: FromDishka[IndexLessonUseCase],
):
    try:
        result = await use_case.execute(lesson_id)
    except EmbeddingServiceError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if result is None:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return result


@router.delete("/{lesson_id}")
@inject
async def delete_lesson(
    user: EducatorUser,
    lesson_id: str,
    use_case: FromDishka[DeleteLessonUseCase],
):
    try:
        ok = await use_case.execute(lesson_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Lesson not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e)) from e
