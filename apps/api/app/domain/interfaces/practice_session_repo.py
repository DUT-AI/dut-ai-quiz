from typing import Protocol
from uuid import UUID

from app.domain.entities.practice import PracticeSessionEntity


class IPracticeSessionRepository(Protocol):
    """Interface protocol for PracticeSessionRepository database operations."""

    async def get(self, session_id: UUID) -> PracticeSessionEntity | None:
        """Get a practice session entity by its UUID."""
        ...

    async def list_history(self, user_id: int) -> list[PracticeSessionEntity]:
        """List practice session history for a user, ordered by starting time descending."""
        ...

    async def add(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        """Add a new practice session entity to the store."""
        ...

    async def save(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        """Save/update an existing practice session entity in the store."""
        ...

    async def get_active_by_lesson(self, user_id: int, lesson_slug: str) -> PracticeSessionEntity | None:
        """Get an active practice session for a specific user and lesson slug."""
        ...
