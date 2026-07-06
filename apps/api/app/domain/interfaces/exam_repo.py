from datetime import datetime
from typing import Protocol
from uuid import UUID

from app.domain.entities.exam import ExamEntity


class IExamRepository(Protocol):
    """Interface protocol for ExamRepository database operations."""

    async def get(self, exam_id: UUID) -> ExamEntity | None:
        """Get a single exam entity by its UUID."""
        ...

    async def list_for_teacher(self, user_id: int) -> list[ExamEntity]:
        """List all exams created by or shared with a teacher."""
        ...

    async def list_published_for_student(
        self, user_id: int, now: datetime
    ) -> list[ExamEntity]:
        """List all published and active exams for a student."""
        ...

    async def add(self, entity: ExamEntity) -> ExamEntity:
        """Add a new exam entity to the store."""
        ...

    async def update(self, entity: ExamEntity) -> ExamEntity:
        """Update an existing exam entity in the store."""
        ...

    async def delete(self, entity: ExamEntity) -> None:
        """Delete an exam entity from the store."""
        ...
