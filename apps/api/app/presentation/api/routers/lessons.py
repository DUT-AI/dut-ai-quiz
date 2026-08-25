from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, Query, UploadFile, File, Form

from app.application.use_cases.lessons.create_lesson_uc import CreateLessonUseCase
from app.application.use_cases.lessons.delete_lesson_uc import DeleteLessonUseCase
from app.application.use_cases.lessons.get_lesson_detail_uc import (
    GetLessonDetailUseCase,
)
from app.application.use_cases.lessons.get_lesson_by_slug_uc import (
    GetLessonBySlugUseCase,
)
from app.application.use_cases.lessons.list_lessons_uc import ListLessonsUseCase
from app.application.use_cases.lessons.reorder_lessons_uc import (
    ReorderLessonsUseCase,
)
from app.application.use_cases.lessons.update_lesson_uc import UpdateLessonUseCase
from app.application.use_cases.lessons.index_lesson_uc import IndexLessonUseCase
from app.application.use_cases.lessons.import_notion_lesson_uc import (
    ImportNotionLessonUseCase,
)
from app.domain.interfaces import EmbeddingServiceError
from app.application.use_cases.questions import ListQuestionsUseCase
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.api.deps import CurrentUser, AdminOrMentorUser
from app.presentation.schemas.lessons import (
    LessonCreate,
    LessonDetailOut,
    LessonOut,
    LessonReorder,
    LessonUpdate,
    LessonIndexOut,
)
from app.presentation.schemas.questions import QuestionListQuery, QuestionOut

router = APIRouter(prefix="/lessons", tags=["lessons"])


@router.get("", response_model=list[LessonOut])
@inject
async def list_lessons(use_case: FromDishka[ListLessonsUseCase]):
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
    Lesson content is stored and managed locally by this service.
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
    # Guests only see practice questions. Admin/Mentors can filter both PRACTICE and EXAM.
    if not user.has_any_role("admin", "MENTOR"):
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
    if not user.has_any_role("admin", "MENTOR"):
        from app.presentation.api.routers.questions import sanitize_questions_for_student
        rows = sanitize_questions_for_student(rows)
    return rows


@router.get("/{lesson_id}", response_model=LessonDetailOut)
@inject
async def get_lesson(
    lesson_id: str,
    user: CurrentUser,
    use_case: FromDishka[GetLessonDetailUseCase],
):
    res = await use_case.execute(lesson_id, is_teacher=user.has_any_role("admin", "MENTOR"))
    if not res:
        raise HTTPException(status_code=404, detail="Lesson not found")
    if not user.has_any_role("admin", "MENTOR"):
        from app.presentation.api.routers.questions import sanitize_questions_for_student
        import copy
        res = copy.deepcopy(res)
        res["questions"] = sanitize_questions_for_student(res["questions"])
    return res


@router.post("", response_model=LessonOut)
@inject
async def create_lesson(
    user: AdminOrMentorUser,
    body: LessonCreate,
    use_case: FromDishka[CreateLessonUseCase],
):
    return await use_case.execute(body)


@router.post("/import-notion", response_model=LessonOut)
@inject
async def import_notion_lesson(
    user: AdminOrMentorUser,
    use_case: FromDishka[ImportNotionLessonUseCase],
    file: UploadFile = File(..., description="ZIP file exported from Notion containing markdown and images"),
    module_id: str | None = Form(None),
    name: str | None = Form(None),
    description: str | None = Form(None),
    lesson_id: str | None = Form(None),
):
    """
    Import a lesson from a ZIP file containing Markdown and images exported from Notion.
    Admin or Mentor only.
    """
    if not file.filename.endswith(".zip"):
        raise HTTPException(status_code=400, detail="Only ZIP files (.zip) are supported")

    mid = None
    if module_id and module_id.strip() and module_id.strip().lower() not in ("null", "undefined", "none", "string"):
        try:
            mid = UUID(module_id.strip())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid module_id UUID format: {module_id}",
            )

    lid = None
    if lesson_id and lesson_id.strip() and lesson_id.strip().lower() not in ("null", "undefined", "none", "string"):
        try:
            lid = UUID(lesson_id.strip())
        except ValueError:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid lesson_id UUID format: {lesson_id}",
            )

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
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(
            status_code=500, detail=f"Failed to import lesson: {str(e)}"
        )



@router.post("/reorder")
@inject
async def reorder_lessons(
    user: AdminOrMentorUser,
    body: LessonReorder,
    use_case: FromDishka[ReorderLessonsUseCase],
):
    """Reorder lessons in the system. Admin or Mentor only."""
    await use_case.execute(body)
    return {"ok": True}


@router.patch("/{lesson_id}", response_model=LessonOut)
@inject
async def update_lesson(
    user: AdminOrMentorUser,
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
    user: AdminOrMentorUser,
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
    user: AdminOrMentorUser,
    lesson_id: str,
    use_case: FromDishka[DeleteLessonUseCase],
):
    try:
        ok = await use_case.execute(lesson_id)
        if not ok:
            raise HTTPException(status_code=404, detail="Lesson not found")
        return {"ok": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
