import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.value_objects import GameSessionStatus


@dataclasses.dataclass
class GameSessionEntity:
    id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    status: GameSessionStatus
    snapshot: dict[str, Any] | None
    tags_filter: list[str]
    question_limit: int
