import dataclasses
from datetime import datetime
from enum import Enum
from uuid import UUID


class SubmissionStatus(str, Enum):
    UPLOADING = "UPLOADING"
    EXTRACTING = "EXTRACTING"
    RUNNING = "RUNNING"
    EVALUATING = "EVALUATING"
    PUBLISHED = "PUBLISHED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"


@dataclasses.dataclass(slots=True)
class HackathonSubmissionEntity:
    id: UUID
    task_id: UUID
    user_id: int
    script_url: str
    status: SubmissionStatus
    created_at: datetime
    team_id: UUID | None = None
    model_url: str | None = None
    public_score: float | None = None
    private_score: float | None = None
    inference_time: float | None = None
    error_message: str | None = None
    logs: str | None = None
    updated_at: datetime | None = None

    @property
    def score(self) -> float | None:
        return self.public_score
