from dataclasses import dataclass, field
from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4


class HomeworkSubmissionStatus(StrEnum):
    UPLOADED = "UPLOADED"
    GRADING = "GRADING"
    GRADED = "GRADED"
    FAILED = "FAILED"


class SubmissionType(StrEnum):
    CODING = "CODING"
    GAME = "GAME"


@dataclass(slots=True)
class HomeworkEntity:
    lesson_id: UUID | None
    title: str
    description: str
    created_by: int
    id: UUID = field(default_factory=uuid4)
    attachment_key: str | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None
    archived_at: datetime | None = None
    grading_status: str = "PENDING"
    grading_error: str | None = None


@dataclass(slots=True)
class HomeworkSubmissionEntity:
    homework_id: UUID
    user_id: int
    object_key: str
    original_filename: str
    submitted_at: datetime
    is_late: bool
    attempt_number: int
    id: UUID = field(default_factory=uuid4)
    status: HomeworkSubmissionStatus = HomeworkSubmissionStatus.UPLOADED
    is_pass: bool | None = None
    score: float | None = None
    feedback: str | None = None
    score_details: list[dict[str, Any]] | None = None
    plagiarism_info: list[dict[str, Any]] | None = None
    is_plagiarized: bool = False
    plagiarized_from_user_id: int | None = None
    grading_error: str | None = None
