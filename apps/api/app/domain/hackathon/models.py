from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import StrEnum
from uuid import UUID

from app.core.datetime_utils import now_ict


class CompetitionParticipationMode(StrEnum):
    individual = "individual"
    team = "team"
    both = "both"


class SubmissionStage(StrEnum):
    queued = "queued"
    uploading = "uploading"
    extracting = "extracting"
    running = "running"
    evaluating = "evaluating"
    publishing = "publishing"
    completed = "completed"
    failed = "failed"
    canceled = "canceled"


class MetricType(StrEnum):
    rmse = "rmse"
    f1_score = "f1_score"
    accuracy = "accuracy"
    log_loss = "log_loss"


@dataclass
class CompetitionEntity:
    id: UUID
    name: str
    description: str
    rules: str
    start_at: datetime | None
    end_at: datetime | None
    participation_mode: CompetitionParticipationMode
    max_submissions_per_participant: int
    cooldown_minutes: int = 5
    is_published: bool = False
    created_by: int = 0
    created_at: datetime = field(default_factory=now_ict)

    def is_open(self, at: datetime | None = None) -> bool:
        current = at or now_ict()
        if not self.is_published:
            return False
        if self.start_at and current < self.start_at:
            return False
        if self.end_at and current > self.end_at:
            return False
        return True


@dataclass
class TaskEntity:
    id: UUID
    competition_id: UUID
    name: str
    description_md: str
    sample_dataset_url: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int
    created_by: int = 0
    created_at: datetime = field(default_factory=now_ict)


@dataclass
class SubmissionEntity:
    id: UUID
    competition_id: UUID
    task_id: UUID
    participant_id: int
    participant_name: str
    script_filename: str
    model_filename: str
    stage: SubmissionStage = SubmissionStage.queued
    score: float | None = None
    inference_time_ms: int | None = None
    submitted_at: datetime = field(default_factory=now_ict)
    finished_at: datetime | None = None
    error_log: list[str] = field(default_factory=list)

    def mark_stage(self, stage: SubmissionStage) -> None:
        self.stage = stage

    def mark_completed(
        self,
        score: float,
        inference_time_ms: int,
        *,
        finished_at: datetime | None = None,
    ) -> None:
        self.stage = SubmissionStage.completed
        self.score = score
        self.inference_time_ms = inference_time_ms
        self.finished_at = finished_at or now_ict()
        self.error_log = []

    def mark_failed(self, error_log: list[str], *, finished_at: datetime | None = None) -> None:
        self.stage = SubmissionStage.failed
        self.error_log = error_log[-50:]
        self.finished_at = finished_at or now_ict()

    def mark_canceled(self, *, finished_at: datetime | None = None) -> None:
        self.stage = SubmissionStage.canceled
        self.finished_at = finished_at or now_ict()

    def is_cancelable(self) -> bool:
        return self.stage in {
            SubmissionStage.queued,
            SubmissionStage.uploading,
            SubmissionStage.extracting,
            SubmissionStage.running,
        }

    def is_successful(self) -> bool:
        return self.stage == SubmissionStage.completed and self.score is not None


@dataclass
class LeaderboardEntryEntity:
    rank: int
    participant_id: int
    participant_name: str
    task_scores: dict[UUID, float]
    total_score: float
    inference_time_ms: int | None
    submitted_at: datetime | None
    representative_submission_id: UUID | None = None


def average_score(scores: list[float]) -> float:
    if not scores:
        return 0.0
    return sum(scores) / len(scores)


def cooldown_deadline(last_finished_at: datetime, cooldown_minutes: int) -> datetime:
    return last_finished_at + timedelta(minutes=cooldown_minutes)
