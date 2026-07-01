from datetime import datetime
from uuid import UUID

from pydantic import BaseModel

from app.presentation.schemas.questions import QuestionOut


class LessonCreate(BaseModel):
    """Schema for creating a lesson."""

    name: str
    description: str = ""
    content_md: str | None = None
    order: int = 0
    slug: str | None = None


class LessonUpdate(BaseModel):
    """Schema for updating a lesson."""

    name: str | None = None
    description: str | None = None
    content_md: str | None = None
    order: int | None = None
    slug: str | None = None


class LessonOut(BaseModel):
    """Schema for lesson output data."""

    id: UUID
    name: str
    description: str
    order: int
    slug: str | None
    created_at: datetime
    content_md: str | None = None

    model_config = {"from_attributes": True}


class LessonDetailOut(LessonOut):
    """Schema for detailed lesson output including questions."""

    questions: list[QuestionOut] = []