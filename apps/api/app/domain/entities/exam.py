import dataclasses
from datetime import datetime
from uuid import UUID

@dataclasses.dataclass
class ExamEntity:
    id: UUID
    title: str
    description: str
    start_time: datetime | None
    end_time: datetime | None
    duration_minutes: int
    max_attempts: int
    is_published: bool
    created_by: int
