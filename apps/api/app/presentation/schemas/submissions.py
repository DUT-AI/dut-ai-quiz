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
    team_id: UUID | None = Field(None, description="Team ID (for team submissions)")


class SubmissionResponse(BaseModel):
    """Schema for submission response."""
    id: UUID
    task_id: UUID
    user_id: int | None
    team_id: UUID | None
    runtime_profile_id: UUID
    script_s3_key: str
    model_s3_key: str | None
    status: SubmissionStatus
    score: float | None
    execution_log: str | None
    error_message: str | None
    submitted_at: datetime
    started_at: datetime | None
    completed_at: datetime | None

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
