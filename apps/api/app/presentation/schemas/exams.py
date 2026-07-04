from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

class ExamCreate(BaseModel):
    title: str
    description: str = ""
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_minutes: int = 60
    max_attempts: int = 1
    is_published: bool = False
    participant_ids: list[int] = Field(default_factory=list)
    show_answers: bool = False


class ExamUpdate(BaseModel):
    title: str | None = None
    description: str | None = None
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_minutes: int | None = None
    max_attempts: int | None = None
    is_published: bool | None = None
    participant_ids: list[int] | None = None
    show_answers: bool | None = None


class ExamOut(BaseModel):
    id: UUID
    title: str
    description: str
    start_time: datetime | None
    end_time: datetime | None
    duration_minutes: int
    max_attempts: int
    is_published: bool
    created_by: int
    participant_ids: list[int]
    show_answers: bool

    model_config = {"from_attributes": True}


class ExamQuestionsPut(BaseModel):
    question_ids: list[UUID] = Field(default_factory=list)


class PracticeStartIn(BaseModel):
    tags: list[str] = Field(default_factory=list)
    limit: int = 10
