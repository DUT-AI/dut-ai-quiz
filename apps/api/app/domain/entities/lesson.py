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
    slug: str | None
    blog_id: str | None
    created_at: datetime