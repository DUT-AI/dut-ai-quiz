from dataclasses import dataclass
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID


class HomeworkSubmissionStatus(StrEnum):
    UPLOADED = "UPLOADED"
    GRADING = "GRADING"
    GRADED = "GRADED"
    FAILED = "FAILED"


@dataclass(slots=True)
class HomeworkEntity:
    lesson_id: UUID | None
    title: str
    description: str
    deadline: datetime
    created_by: int
    id: UUID | None = None
    attachment_key: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    archived_at: datetime | None = None


@dataclass(slots=True)
class HomeworkSubmissionEntity:
    homework_id: UUID
    user_id: int
    object_key: str
    original_filename: str
    submitted_at: datetime
    is_late: bool
    attempt_number: int
    id: UUID | None = None
    status: HomeworkSubmissionStatus = HomeworkSubmissionStatus.UPLOADED
    is_pass: bool | None = None
    score: float | None = None
    feedback: str | None = None
    score_details: list[dict[str, Any]] | None = None
    plagiarism_info: list[dict[str, Any]] | None = None
    is_plagiarized: bool = False
    plagiarized_from_user_id: int | None = None
    grading_error: str | None = None
