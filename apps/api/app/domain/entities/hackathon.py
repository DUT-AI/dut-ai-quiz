import dataclasses
from datetime import datetime
from uuid import UUID
from enum import Enum

class ParticipationMode(str, Enum):
    INDIVIDUAL = "individual"
    TEAM = "team"
    BOTH = "both"

@dataclasses.dataclass(slots=True)
class HackathonEntity:
    id: UUID
    name: str
    description: str
    rules: str
    start_time: datetime | None
    end_time: datetime | None
    participation_mode: ParticipationMode
    created_by: int
    created_at: datetime
    updated_at: datetime | None = None