import dataclasses
from datetime import datetime
from typing import Any
from uuid import UUID

from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import GameSessionSnapshot


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

    def get_snapshot_state(self) -> GameSessionSnapshot:
        return GameSessionSnapshot.from_dict(self.snapshot)

    def set_snapshot_state(self, snap: GameSessionSnapshot) -> None:
        self.snapshot = snap.to_dict()
