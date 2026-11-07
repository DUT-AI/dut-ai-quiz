from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class QuestionOptionDetail(BaseModel):
    id: str
    content: str
    is_correct: bool


class StudentAttemptQuestionDetail(BaseModel):
    id: UUID
    content: str
    options: list[QuestionOptionDetail]
    selected_option_id: str | None
    correct_option_id: str | None
    is_correct: bool | None


class StudentAttemptFocusEventOut(BaseModel):
    id: UUID
    event: str
    received_at: datetime


class StudentAttemptDetailOut(BaseModel):
    id: UUID
    exam_id: UUID
    user_id: int
    status: str
    score: float | None
    tab_out_count: int
    started_at: datetime
    completed_at: datetime | None
    expires_at: datetime
    questions: list[StudentAttemptQuestionDetail]
    focus_events: list[StudentAttemptFocusEventOut]


class StudentExamAttemptsResponse(BaseModel):
    student_id: int
    exam_id: UUID
    attempts: list[StudentAttemptDetailOut]
    total_attempts: int
    best_score: float | None
    max_tab_out: int


class DeleteAttemptResponse(BaseModel):
    success: bool
    message: str
    deleted_attempt_id: UUID
