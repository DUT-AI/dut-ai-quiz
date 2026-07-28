from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.homework import HomeworkSubmissionStatus


class HomeworkSubmissionOut(BaseModel):
    id: UUID
    homework_id: UUID
    user_id: int
    original_filename: str
    submitted_at: datetime
    is_late: bool
    attempt_number: int
    status: HomeworkSubmissionStatus
    is_pass: bool | None = None
    score: float | None = None
    feedback: str | None = None
    score_details: list[dict[str, Any]] | None = None
    plagiarism_info: list[dict[str, Any]] | None = None
    is_plagiarized: bool = False
    plagiarized_from_user_id: int | None = None
    grading_error: str | None = None
    owner_name: str | None = None
    owner_avatar_url: str | None = None


class HomeworkOut(BaseModel):
    id: UUID
    lesson_id: UUID
    title: str
    description: str
    deadline: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime
    has_attachment: bool
    assignee_ids: list[int] = Field(default_factory=list)
    assignment_count: int = 0
    submitted_count: int = 0
    current_submission: HomeworkSubmissionOut | None = None


class HomeworkListResponse(BaseModel):
    data: list[HomeworkOut]
    is_success: bool = True


class HomeworkResponse(BaseModel):
    data: HomeworkOut
    is_success: bool = True


class SubmissionListResponse(BaseModel):
    data: list[HomeworkSubmissionOut]
    is_success: bool = True


class SubmissionResponse(BaseModel):
    data: HomeworkSubmissionOut | None
    is_success: bool = True


class DownloadUrlResponse(BaseModel):
    data: dict[str, str]
    is_success: bool = True
