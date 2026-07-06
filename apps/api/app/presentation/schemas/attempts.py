from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.value_objects import AttemptStatus


class AnswerItem(BaseModel):
    question_id: UUID
    selected_option_id: str | None = None


class AttemptAnswersPatch(BaseModel):
    answers: list[AnswerItem] = Field(default_factory=list)


class AttemptOut(BaseModel):
    id: UUID
    exam_id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    expires_at: datetime
    score: float | None
    status: AttemptStatus
    tab_out_count: int

    model_config = {"from_attributes": True}


class AttemptAnswerOut(BaseModel):
    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: str | None

    model_config = {"from_attributes": True}


class ShuffledOptionOut(BaseModel):
    id: str
    text: str
    fixed: bool

    model_config = {"from_attributes": True}


class ShuffledQuestionOut(BaseModel):
    question_id: str
    content: str
    options: list[ShuffledOptionOut]
    tags: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}


class StartAttemptOut(BaseModel):
    attempt_id: UUID
    expires_at: datetime
    tab_out_count: int
    questions: list[ShuffledQuestionOut]


class FocusEventOut(BaseModel):
    tab_out_count: int
    action: str
    attempt: dict | None = None


class LeaderboardRow(BaseModel):
    user_id: int
    best_score: float


class PresignBody(BaseModel):
    key: str
    content_type: str = "application/octet-stream"
