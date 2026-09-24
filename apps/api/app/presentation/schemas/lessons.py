from datetime import datetime
from uuid import UUID

from app.presentation.schemas.questions import QuestionOut
from pydantic import BaseModel


class LessonCreate(BaseModel):
    """Schema for creating a lesson."""

    name: str
    description: str = ""
    content_md: str | None = None
    order: int = 0
    slug: str | None = None
    module_id: UUID | None = None


class LessonUpdate(BaseModel):
    """Schema for updating a lesson."""

    name: str | None = None
    description: str | None = None
    content_md: str | None = None
    order: int | None = None
    slug: str | None = None
    module_id: UUID | None = None


class LessonOut(BaseModel):
    """Schema for lesson output data."""

    id: UUID
    name: str
    description: str
    order: int
    slug: str | None
    created_at: datetime
    module_id: UUID | None = None
    content_md: str | None = None

    model_config = {"from_attributes": True}


class LessonDetailOut(LessonOut):
    """Schema for detailed lesson output including questions."""

    questions: list[QuestionOut] = []
    has_game_questions: bool = False


class LessonReorderItem(BaseModel):
    id: UUID
    order: int
    module_id: UUID | None = None


class LessonReorder(BaseModel):
    items: list[LessonReorderItem]


class RelatedLessonOut(BaseModel):
    id: UUID
    name: str
    description: str
    slug: str | None
    score: float
    matched_chunk: str


class RelativeDocumentOut(BaseModel):
    document_title: str
    full_md: str
    relative_chunk: list[str]


class LessonIndexOut(BaseModel):
    lesson_id: UUID
    status: str
