import dataclasses
from datetime import datetime
from uuid import UUID

from app.domain.value_objects.enums import SubmissionStatus


@dataclasses.dataclass(slots=True)
class HackathonSubmissionEntity:
    """
    Represents a participant's submission to a hackathon task.
    Each submission is tied to a specific runtime profile.
    """

    id: UUID
    task_id: UUID
    status: SubmissionStatus
    created_at: datetime

    user_id: int | None = None
    team_id: UUID | None = None

    runtime_profile_id: UUID | None = None

    script_s3_key: str | None = None
    model_s3_key: str | None = None

    script_url: str | None = None
    model_url: str | None = None

    score: float | None = None
    execution_log: str | None = None
    logs: str | None = None
    error_message: str | None = None

    submitted_at: datetime | None = None
    started_at: datetime | None = None
    completed_at: datetime | None = None
    updated_at: datetime | None = None

    def mark_running(self) -> None:
        """Update status when evaluation starts."""
        self.status = SubmissionStatus.RUNNING
        self.started_at = datetime.utcnow()
        self.updated_at = self.started_at

    def mark_completed(self, score: float, log: str) -> None:
        """Update status when evaluation succeeds."""
        self.status = SubmissionStatus.PUBLISHED
        self.score = score
        self.execution_log = log
        self.logs = log
        self.completed_at = datetime.utcnow()
        self.updated_at = self.completed_at

    def mark_failed(self, error: str, log: str | None = None) -> None:
        """Update status when evaluation fails."""
        self.status = SubmissionStatus.FAILED
        self.error_message = error
        self.execution_log = log
        self.logs = log
        self.completed_at = datetime.utcnow()
        self.updated_at = self.completed_at

    def mark_timeout(self, log: str | None = None) -> None:
        """Update status when execution times out."""
        self.status = SubmissionStatus.FAILED
        self.error_message = "Execution exceeded timeout limit"
        self.execution_log = log
        self.logs = log
        self.completed_at = datetime.utcnow()
        self.updated_at = self.completed_at