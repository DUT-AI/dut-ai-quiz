from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, model_validator

from app.presentation.schemas.questions import QuestionOut


class LessonCreate(BaseModel):
    name: str = ""
    description: str = ""
    content_md: str = ""
    order: int = 0
    slug: str | None = None
    blog_id: str | None = None
    
    @model_validator(mode='after')
    def validate_blog_id_or_name(self):
        # Nếu không có blog_id thì bắt buộc phải có name
        if not self.blog_id and not self.name:
            raise ValueError("Either blog_id or name must be provided")
        return self


class LessonUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    content_md: str | None = None
    order: int | None = None
    slug: str | None = None
    blog_id: str | None = None


class LessonOut(BaseModel):
    id: UUID
    name: str
    description: str
    content_md: str
    order: int
    slug: str | None
    blog_id: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class LessonDetailOut(LessonOut):
    questions: list[QuestionOut] = []