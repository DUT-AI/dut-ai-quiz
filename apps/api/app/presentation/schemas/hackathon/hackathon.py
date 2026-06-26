from __future__ import annotations

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.hackathon.models import CompetitionParticipationMode, MetricType, SubmissionStage


class CompetitionCreate(BaseModel):
    name: str
    description: str
    rules: str = ""
    start_at: datetime | None = None
    end_at: datetime | None = None
    participation_mode: CompetitionParticipationMode = CompetitionParticipationMode.both
    max_submissions_per_participant: int = Field(default=5, ge=1)
    cooldown_minutes: int = Field(default=5, ge=0)
    is_published: bool = False


class CompetitionOut(BaseModel):
    id: UUID
    name: str
    description: str
    rules: str
    start_at: datetime | None
    end_at: datetime | None
    participation_mode: CompetitionParticipationMode
    max_submissions_per_participant: int
    cooldown_minutes: int
    is_published: bool
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class TaskCreate(BaseModel):
    name: str
    description_md: str
    sample_dataset_url: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int = Field(default=5, ge=1)


class TaskOut(BaseModel):
    id: UUID
    competition_id: UUID
    name: str
    description_md: str
    sample_dataset_url: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int
    created_by: int
    created_at: datetime

    model_config = {"from_attributes": True}


class SubmissionCreate(BaseModel):
    participant_name: str
    script_filename: str
    model_filename: str


class SubmissionResultCreate(BaseModel):
    score: float = 0.0
    inference_time_ms: int = Field(default=0, ge=0)
    error_log: list[str] = Field(default_factory=list)
    failed: bool = False


class SubmissionOut(BaseModel):
    id: UUID
    competition_id: UUID
    task_id: UUID
    participant_id: int
    participant_name: str
    script_filename: str
    model_filename: str
    stage: SubmissionStage
    score: float | None
    inference_time_ms: int | None
    submitted_at: datetime
    finished_at: datetime | None
    error_log: list[str]

    model_config = {"from_attributes": True}


class LeaderboardRow(BaseModel):
    rank: int
    participant_id: int
    participant_name: str
    task_scores: dict[UUID, float]
    total_score: float
    inference_time_ms: int | None
    submitted_at: datetime | None
