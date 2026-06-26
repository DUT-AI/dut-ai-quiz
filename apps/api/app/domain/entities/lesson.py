from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class LessonEntity:
    id: UUID
    name: str
    description: str
    content_md: str
    order: int
    created_at: datetime