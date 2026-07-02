from typing import Protocol
from uuid import UUID

from app.domain.entities.lesson import LessonEntity


class ILessonRepository(Protocol):
    """Interface protocol for LessonRepository database operations."""

    async def list_all(self) -> list[LessonEntity]:
        """List all lesson entities in ascending order of their order and creation time."""
        ...

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        """Get a single lesson entity by its UUID."""
        ...

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        """Get a single lesson entity by its slug."""
        ...

    async def add(self, entity: LessonEntity) -> LessonEntity:
        """Add a new lesson entity to the store."""
        ...

    async def update(self, entity: LessonEntity) -> LessonEntity:
        """Update an existing lesson entity in the store."""
        ...

    async def delete(self, entity: LessonEntity) -> None:
        """Delete a lesson entity from the store."""
        ...
