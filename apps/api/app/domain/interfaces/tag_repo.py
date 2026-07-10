from typing import Protocol
from uuid import UUID

from app.domain.entities.tag import TagEntity


class ITagRepository(Protocol):
    """Interface protocol for TagRepository database operations."""

    async def get(self, tag_id: UUID) -> TagEntity | None:
        """Get a tag by its ID."""
        ...

    async def get_by_name(self, name: str) -> TagEntity | None:
        """Get a tag by its name."""
        ...

    async def list_all(self) -> list[TagEntity]:
        """List all tags."""
        ...

    async def add(self, entity: TagEntity) -> TagEntity:
        """Add a new tag."""
        ...

    async def delete(self, tag_id: UUID) -> None:
        """Delete a tag by its ID."""
        ...
