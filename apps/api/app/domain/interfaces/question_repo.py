from typing import Protocol
from uuid import UUID

from app.domain.entities.question import QuestionEntity
from app.domain.value_objects import Difficulty, PoolType


class IQuestionRepository(Protocol):
    """Interface protocol for QuestionRepository database operations."""

    async def get(self, question_id: UUID) -> QuestionEntity | None:
        """Get a single question entity by its UUID."""
        ...

    async def list_all(
        self,
        *,
        pool_type: PoolType | None = None,
        difficulty: Difficulty | None = None,
        lesson_id: UUID | None = None,
        tag: str | None = None,
        offset: int = 0,
        limit: int = 50,
    ) -> list[QuestionEntity]:
        """List questions matching the filters with pagination."""
        ...

    async def add(self, entity: QuestionEntity) -> QuestionEntity:
        """Add a new question entity to the store."""
        ...

    async def add_bulk(self, entities: list[QuestionEntity]) -> list[QuestionEntity]:
        """Add a list of question entities to the store in bulk."""
        ...

    async def update(self, entity: QuestionEntity) -> QuestionEntity:
        """Update an existing question entity in the store."""
        ...

    async def delete(self, entity: QuestionEntity) -> None:
        """Delete a question entity from the store."""
        ...
