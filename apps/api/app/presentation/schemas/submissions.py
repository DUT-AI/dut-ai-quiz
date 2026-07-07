"""
Pydantic schemas for Hackathon Submission API
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.value_objects.enums import SubmissionStatus


class SubmissionCreate(BaseModel):
    """Schema for creating a submission."""

    task_id: UUID = Field(..., description="Task ID")
    runtime_profile_id: UUID = Field(..., description="Required: Runtime profile to use")
    script_s3_key: str = Field(..., min_length=1, description="S3 key for submission script")
    model_s3_key: str | None = Field(None, description="Optional: S3 key for model file")
    team_id: UUID | None = Field(None, description="Team ID for team submissions")


class SubmissionResponse(BaseModel):
    """Schema for submission response."""

    id: UUID
    task_id: UUID
    user_id: int | None
    team_id: UUID | None = None

    runtime_profile_id: UUID | None = None

    script_s3_key: str | None = None
    model_s3_key: str | None = None

    script_url: str | None = None
    model_url: str | None = None

    status: SubmissionStatus
    score: float | None = None

    execution_log: str | None = None
    logs: str | None = None
    error_message: str | None = None

    submitted_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class SubmissionOut(BaseModel):
    id: UUID
    task_id: UUID
    user_id: int | None
    team_id: UUID | None = None

    script_url: str | None = None
    model_url: str | None = None

    status: SubmissionStatus
    score: float | None = None
    error_message: str | None = None
    logs: str | None = None

    created_at: datetime | None = None
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class SubmissionListResponse(BaseModel):
    """Schema for listing submissions."""

    submissions: list[SubmissionResponse]
    total: int


class SubmissionStatusUpdate(BaseModel):
    """Schema for worker updating submission status."""

    status: SubmissionStatus
    score: float | None = None
    execution_log: str | None = None
    error_message: str | None = None


class PresignSubmitIn(BaseModel):
    script_filename: str
    model_filename: str | None = None


class PresignURLInfo(BaseModel):
    upload_url: str
    s3_key: str
    download_url: str


class PresignSubmitOut(BaseModel):
    submission_id: UUID
    script: PresignURLInfo
    model: PresignURLInfo | None = None


class SubmitTaskIn(BaseModel):
    submission_id: UUID
    script_s3_key: str
    script_url: str
    model_s3_key: str | None = None
    model_url: str | None = None