from typing import Protocol
from uuid import UUID

from app.domain.entities.game import GameSessionEntity


class IGameSessionRepository(Protocol):
    """Interface protocol for GameSessionRepository database operations."""

    async def get(self, session_id: UUID) -> GameSessionEntity | None:
        """Get a game session entity by its UUID."""
        ...

    async def list_history(self, user_id: int) -> list[GameSessionEntity]:
        """List game session history for a user, ordered by starting time descending."""
        ...

    async def add(self, entity: GameSessionEntity) -> GameSessionEntity:
        """Add a new game session entity to the store."""
        ...

    async def save(self, entity: GameSessionEntity) -> GameSessionEntity:
        """Save/update an existing game session entity in the store."""
        ...

    async def get_active_by_lesson(self, user_id: int, lesson_slug: str) -> GameSessionEntity | None:
        """Get an active game session for a specific user and lesson slug."""
        ...

    async def count_completed_by_lesson(self, user_id: int, lesson_slug: str) -> int:
        """Count completed sessions for a specific user and lesson slug."""
        ...

    async def get_leaderboard_by_lesson(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        """Get the game leaderboard for a specific lesson."""
        ...
