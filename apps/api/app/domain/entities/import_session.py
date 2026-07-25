import dataclasses
from datetime import datetime
from uuid import UUID


@dataclasses.dataclass
class ImportSessionEntity:
    id: UUID
    user_id: int
    file_name: str
    status: str  # 'PROCESSING', 'COMPLETED', 'FAILED'
    total_questions: int = 0
    processed_questions: int = 0
    error_message: str | None = None
    created_at: datetime = dataclasses.field(default_factory=datetime.utcnow)
    # Context for auto-assignment
    lesson_id: UUID | None = None  # Fixed lesson if imported from lesson page
    target_scope: str = "LESSON"  # 'LESSON' or 'QLBH'
