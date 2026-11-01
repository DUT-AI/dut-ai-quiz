from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class LessonVideoEntity:
    """Domain entity representing a YouTube reference video attached to a lesson."""

    id: UUID
    lesson_id: UUID
    title: str
    url: str
    youtube_video_id: str
    start_seconds: int = 0
    order: int = 0
    description: str = ""
    created_at: datetime | None = None
    updated_at: datetime | None = None
