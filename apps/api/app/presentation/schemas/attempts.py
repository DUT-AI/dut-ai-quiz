from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.value_objects import AttemptStatus
from app.presentation.schemas.questions import QuestionOut
from pydantic import BaseModel, Field, field_validator, model_validator


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
    correct_count: int | None = None
    total_questions: int | None = None
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
    id: str
    question_id: str
    content: str
    options: list[ShuffledOptionOut]
    tags: list[str] = Field(default_factory=list)

    model_config = {"from_attributes": True}

    @model_validator(mode="before")
    @classmethod
    def sync_id_and_question_id(cls, data: Any) -> Any:
        if isinstance(data, dict):
            qid = data.get("id") or data.get("question_id")
            if qid:
                data["id"] = str(qid)
                data["question_id"] = str(qid)
        elif hasattr(data, "question_id"):
            qid = data.question_id
            if hasattr(data, "__dict__"):
                data.__dict__["id"] = str(qid)
                data.__dict__["question_id"] = str(qid)
        return data

    @field_validator("tags", mode="before")
    @classmethod
    def convert_tags_to_str(cls, v: list | None) -> list[str]:
        if not v:
            return []
        return [str(item) for item in v]


class AttemptSavedAnswerItem(BaseModel):
    question_id: UUID
    selected_option_id: str | None = None


class StartAttemptIn(BaseModel):
    action: str = "start"


class StartAttemptOut(BaseModel):
    attempt_id: UUID
    expires_at: datetime
    tab_out_count: int
    questions: list[ShuffledQuestionOut]
    is_resumed: bool = False
    saved_answers: list[AttemptSavedAnswerItem] = Field(default_factory=list)
    server_time: datetime | None = None


class ActiveAttemptOut(BaseModel):
    attempt_id: UUID
    expires_at: datetime
    tab_out_count: int
    server_time: datetime


class GetAttemptOut(BaseModel):
    attempt: AttemptOut
    questions: list[ShuffledQuestionOut]
    saved_answers: list[AttemptSavedAnswerItem] = Field(default_factory=list)
    server_time: datetime


class AttemptReviewOut(BaseModel):
    attempt: AttemptOut
    answers: list[AttemptAnswerOut]
    questions: list[QuestionOut]


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
