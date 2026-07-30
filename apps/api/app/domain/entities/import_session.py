import dataclasses
from datetime import datetime
from uuid import UUID
from enum import Enum


class ImportSessionStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclasses.dataclass(slots=True)
class ImportSessionEntity:
    id: UUID
    user_id: int
    target_scope: str | None
    status: ImportSessionStatus
    created_at: datetime
    error_message: str | None = None
    updated_at: datetime | None = None
    file_name: str | None = None
    total_questions: int | None = 0
    processed_questions: int | None = 0
    lesson_id: UUID | None = None
