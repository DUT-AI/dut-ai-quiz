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
    user_id: int | None  # For individual submissions
    team_id: UUID | None  # For team submissions
    runtime_profile_id: UUID  # Required: which environment to use
    script_s3_key: str  # S3 path to the submission script
    model_s3_key: str | None  # Optional: S3 path to model file
    status: SubmissionStatus
    score: float | None  # Calculated score after evaluation
    execution_log: str | None  # Limited log output (last 50 lines)
    error_message: str | None  # Error details if failed
    submitted_at: datetime
    started_at: datetime | None = None
    completed_at: datetime | None = None
    
    def mark_running(self) -> None:
        """Update status when evaluation starts."""
        self.status = SubmissionStatus.RUNNING
        self.started_at = datetime.utcnow()
    
    def mark_completed(self, score: float, log: str) -> None:
        """Update status when evaluation succeeds."""
        self.status = SubmissionStatus.COMPLETED
        self.score = score
        self.execution_log = log
        self.completed_at = datetime.utcnow()
    
    def mark_failed(self, error: str, log: str | None = None) -> None:
        """Update status when evaluation fails."""
        self.status = SubmissionStatus.FAILED
        self.error_message = error
        self.execution_log = log
        self.completed_at = datetime.utcnow()
    
    def mark_timeout(self, log: str | None = None) -> None:
        """Update status when execution times out."""
        self.status = SubmissionStatus.TIMEOUT
        self.error_message = "Execution exceeded timeout limit"
        self.execution_log = log
        self.completed_at = datetime.utcnow()
