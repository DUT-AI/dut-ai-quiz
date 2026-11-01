from typing import Protocol
from uuid import UUID

from app.domain.entities.lesson_video import LessonVideoEntity


class ILessonVideoRepository(Protocol):
    """Interface protocol for LessonVideoRepository operations."""

    async def list_by_lesson_id(self, lesson_id: UUID) -> list[LessonVideoEntity]:
        """List all reference videos for a lesson ordered by order ASC, created_at ASC."""
        ...

    async def get(self, video_id: UUID) -> LessonVideoEntity | None:
        """Get a single reference video by ID."""
        ...

    async def add(self, entity: LessonVideoEntity) -> LessonVideoEntity:
        """Add a new reference video."""
        ...

    async def replace_lesson_videos(
        self, lesson_id: UUID, new_videos: list[LessonVideoEntity]
    ) -> list[LessonVideoEntity]:
        """Replace all reference videos for a lesson atomically."""
        ...

    async def delete(self, video_id: UUID) -> bool:
        """Delete a reference video by ID."""
        ...
