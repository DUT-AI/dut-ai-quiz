import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID
from app.infrastructure.persistence.models import AttemptStatus

@dataclasses.dataclass
class AttemptEntity:
    id: UUID
    exam_id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    expires_at: datetime
    score: float | None
    status: AttemptStatus
    tab_out_count: int
    shuffle_seed: int | None
    shuffle_snapshot: dict[str, Any] | None

@dataclasses.dataclass
class AttemptAnswerEntity:
    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: str | None

@dataclasses.dataclass
class FocusEventEntity:
    id: UUID
    attempt_id: UUID
    client_event_id: str
    event: str
    received_at: datetime
