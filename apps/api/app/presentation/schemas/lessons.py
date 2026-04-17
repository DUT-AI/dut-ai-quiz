from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.presentation.schemas.questions import QuestionOut

class LessonCreate(BaseModel):
    name: str
    description: str = ""
    order: int = 0

class LessonUpdate(BaseModel):
    name: str | None = None
    description: str | None = None
    order: int | None = None

class LessonOut(BaseModel):
    id: UUID
    name: str
    description: str
    order: int
    created_at: datetime

    model_config = {"from_attributes": True}

class LessonDetailOut(LessonOut):
    questions: list[QuestionOut] = []
