from datetime import datetime
from typing import Any
from uuid import UUID

from pydantic import BaseModel

from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)


class HomeworkFileDTO(BaseModel):
    filename: str
    content: bytes


class CreateHomeworkDTO(BaseModel):
    lesson_id: UUID
    title: str
    description: str = ""
    deadline: datetime
    created_by: int
    file: HomeworkFileDTO | None = None


class UpdateHomeworkDTO(BaseModel):
    lesson_id: UUID | None = None
    title: str | None = None
    description: str | None = None
    deadline: datetime | None = None
    file: HomeworkFileDTO | None = None


class SubmitHomeworkDTO(BaseModel):
    homework_id: UUID
    user_id: int
    file: HomeworkFileDTO


class HomeworkSubmissionOutDTO(BaseModel):
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

    @classmethod
    def from_entity(
        cls,
        entity: HomeworkSubmissionEntity,
        *,
        owner_name: str | None = None,
        owner_avatar_url: str | None = None,
    ) -> "HomeworkSubmissionOutDTO":
        if entity.id is None:
            raise ValueError("Homework submission must be persisted")
        return cls(
            id=entity.id,
            homework_id=entity.homework_id,
            user_id=entity.user_id,
            original_filename=entity.original_filename,
            submitted_at=entity.submitted_at,
            is_late=entity.is_late,
            attempt_number=entity.attempt_number,
            status=entity.status,
            is_pass=entity.is_pass,
            score=entity.score,
            feedback=entity.feedback,
            score_details=entity.score_details,
            plagiarism_info=entity.plagiarism_info,
            is_plagiarized=entity.is_plagiarized,
            plagiarized_from_user_id=entity.plagiarized_from_user_id,
            grading_error=entity.grading_error,
            owner_name=owner_name,
            owner_avatar_url=owner_avatar_url,
        )


class HomeworkOutDTO(BaseModel):
    id: UUID
    lesson_id: UUID | None
    title: str
    description: str
    deadline: datetime
    created_by: int
    created_at: datetime
    updated_at: datetime
    has_attachment: bool
    submitted_count: int = 0
    current_submission: HomeworkSubmissionOutDTO | None = None

    @classmethod
    def from_entity(
        cls,
        entity: HomeworkEntity,
        *,
        submitted_count: int = 0,
        current_submission: HomeworkSubmissionEntity | None = None,
    ) -> "HomeworkOutDTO":
        if entity.id is None or entity.created_at is None or entity.updated_at is None:
            raise ValueError("Homework must be persisted")
        return cls(
            id=entity.id,
            lesson_id=entity.lesson_id,
            title=entity.title,
            description=entity.description,
            deadline=entity.deadline,
            created_by=entity.created_by,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            has_attachment=entity.attachment_key is not None,
            submitted_count=submitted_count,
            current_submission=(
                HomeworkSubmissionOutDTO.from_entity(current_submission)
                if current_submission
                else None
            ),
        )
