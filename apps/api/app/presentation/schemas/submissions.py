from datetime import datetime
from uuid import UUID
from pydantic import BaseModel
from app.domain.entities.submission import SubmissionStatus


class SubmissionOut(BaseModel):
    id: UUID
    task_id: UUID
    user_id: int
    team_id: UUID | None = None
    script_url: str
    model_url: str | None = None
    status: SubmissionStatus
    score: float | None = None
    error_message: str | None = None
    logs: str | None = None
    created_at: datetime
    updated_at: datetime | None = None

    class Config:
        from_attributes = True


class PresignSubmitIn(BaseModel):
    script_filename: str
    model_filename: str


class PresignURLInfo(BaseModel):
    upload_url: str
    s3_key: str
    download_url: str


class PresignSubmitOut(BaseModel):
    submission_id: UUID
    script: PresignURLInfo
    model: PresignURLInfo


class SubmitTaskIn(BaseModel):
    submission_id: UUID
    script_s3_key: str
    script_url: str
    model_s3_key: str
    model_url: str


