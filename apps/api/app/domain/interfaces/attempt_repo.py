from typing import Protocol
from uuid import UUID

from app.domain.entities.attempt import AttemptAnswerEntity, AttemptEntity


class IAttemptRepository(Protocol):
    """Interface protocol for AttemptRepository database operations."""

    async def count_for_user_exam(self, user_id: int, exam_id: UUID) -> int:
        """Count total attempts for a user on a specific exam."""
        ...

    async def count_completed_for_user_exam(self, user_id: int, exam_id: UUID) -> int:
        """Count completed attempts for a user on a specific exam."""
        ...

    async def get(self, attempt_id: UUID) -> AttemptEntity | None:
        """Get a single attempt entity by its UUID."""
        ...

    async def add(self, entity: AttemptEntity) -> AttemptEntity:
        """Add a new attempt entity to the store."""
        ...

    async def save(self, entity: AttemptEntity) -> AttemptEntity:
        """Save/update an existing attempt entity in the store."""
        ...

    async def list_answers(self, attempt_id: UUID) -> list[AttemptAnswerEntity]:
        """List all answers recorded for a specific attempt."""
        ...

    async def upsert_answer(
        self, attempt_id: UUID, question_id: UUID, selected_option_id: str | None
    ) -> AttemptAnswerEntity:
        """Insert or update an answer for an attempt question."""
        ...

    async def list_for_exam(
        self, exam_id: UUID, offset: int = 0, limit: int = 100
    ) -> list[AttemptEntity]:
        """List attempts for an exam with pagination."""
        ...

    async def list_all_for_exam(self, exam_id: UUID) -> list[AttemptEntity]:
        """List all attempts for an exam ordered by start time."""
        ...

    async def list_for_user(self, user_id: int) -> list[tuple[AttemptEntity, str]]:
        """List all attempts for a user, paired with the exam title."""
        ...

    async def leaderboard_best_per_user(
        self, exam_id: UUID, limit: int = 100
    ) -> list[tuple[int, float]]:
        """Get the leaderboard of best completed scores per user for an exam."""
        ...

    async def list_completed_ids_by_question_id(self, question_id: UUID) -> list[UUID]:
        """List all completed attempt IDs that answered a specific question ID."""
        ...

    async def list_all_answers_for_exam(
        self, exam_id: UUID
    ) -> list[AttemptAnswerEntity]:
        """List all answers from completed attempts of an exam."""
        ...


class IAttemptAnswerRepository(Protocol):
    """Interface protocol for AttemptAnswerRepository database operations."""

    async def list_for_attempt(self, attempt_id: UUID) -> list[AttemptAnswerEntity]:
        """List all answers recorded for a specific attempt ID."""
        ...
