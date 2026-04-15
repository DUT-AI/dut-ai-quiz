import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID
from app.infrastructure.persistence.models import PracticeSessionStatus, Difficulty

@dataclasses.dataclass
class PracticeSessionEntity:
    id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    status: PracticeSessionStatus
    snapshot: dict[str, Any] | None
    tags_filter: list[str]
    difficulty_filter: Difficulty | None
    question_limit: int
