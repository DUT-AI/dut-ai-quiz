from typing import Protocol
from uuid import UUID

from app.domain.entities.game_answer import GameSessionAnswerEntity


class IGameSessionAnswerRepository(Protocol):
    """Interface protocol for GameSessionAnswerRepository database operations."""

    async def add(self, answer: GameSessionAnswerEntity) -> GameSessionAnswerEntity:
        """Record an answer turn into the append-only ledger."""
        ...

    async def list_by_session(self, session_id: UUID) -> list[GameSessionAnswerEntity]:
        """List all answers recorded for a game session in chronological order."""
        ...

    async def get_by_turn(
        self, session_id: UUID, question_id: UUID
    ) -> GameSessionAnswerEntity | None:
        """Get the answer record for a specific turn in a session if already answered."""
        ...

    async def count_by_session(self, session_id: UUID) -> int:
        """Count total answers recorded for a session."""
        ...
