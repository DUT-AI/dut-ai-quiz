from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import inject, FromDishka
from app.application.use_cases.lessons.lesson_use_case import (
    ListLessonsUseCase, 
    CreateLessonUseCase, 
    UpdateLessonUseCase, 
    DeleteLessonUseCase
)
from app.presentation.schemas.lessons import LessonCreate, LessonUpdate, LessonOut

router = APIRouter(prefix="/lessons", tags=["lessons"])

@router.get("", response_model=list[LessonOut])
@inject
async def list_lessons(use_case: FromDishka[ListLessonsUseCase]):
    return await use_case.execute()

@router.post("", response_model=LessonOut)
@inject
async def create_lesson(
    body: LessonCreate, 
    use_case: FromDishka[CreateLessonUseCase]
):
    return await use_case.execute(body)

@router.patch("/{lesson_id}", response_model=LessonOut)
@inject
async def update_lesson(
    lesson_id: str,
    body: LessonUpdate,
    use_case: FromDishka[UpdateLessonUseCase]
):
    res = await use_case.execute(lesson_id, body)
    if not res:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return res

@router.delete("/{lesson_id}")
@inject
async def delete_lesson(
    lesson_id: str,
    use_case: FromDishka[DeleteLessonUseCase]
):
    ok = await use_case.execute(lesson_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Lesson not found")
    return {"ok": True}
