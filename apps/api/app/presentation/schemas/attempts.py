from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.infrastructure.persistence.models import AttemptStatus


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


class StartAttemptOut(BaseModel):
    attempt_id: UUID
    expires_at: datetime
    tab_out_count: int
    questions: list[dict]


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
