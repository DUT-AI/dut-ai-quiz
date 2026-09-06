import dataclasses
from datetime import datetime
from enum import Enum
from uuid import UUID


class ImportSessionStatus(str, Enum):
    PROCESSING = "PROCESSING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"


@dataclasses.dataclass(slots=True)
class ImportSessionEntity:
    id: UUID
    user_id: int
    file_name: str | None = None
    target_scope: str = "LESSON"
    status: ImportSessionStatus = ImportSessionStatus.PROCESSING
    created_at: datetime = dataclasses.field(default_factory=datetime.utcnow)
    error_message: str | None = None
    updated_at: datetime | None = None
    total_questions: int = 0
    processed_questions: int = 0
    lesson_id: UUID | None = None
