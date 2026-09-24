from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class LessonEntity:
    """Domain entity representing a lesson."""

    id: UUID
    name: str
    description: str
    order: int
    slug: str | None
    created_at: datetime
    module_id: UUID | None = None
    content_md: str | None = None
