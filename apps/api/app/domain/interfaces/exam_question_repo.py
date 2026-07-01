from typing import Protocol
from uuid import UUID

from app.domain.entities.question import QuestionEntity


class IExamQuestionRepository(Protocol):
    """Interface protocol for ExamQuestionRepository database operations."""

    async def list_question_ids_ordered(self, exam_id: UUID) -> list[UUID]:
        """List question IDs associated with an exam, ordered by position."""
        ...

    async def replace_all(self, exam_id: UUID, question_ids: list[UUID]) -> None:
        """Replace all questions in an exam with the specified list of question IDs."""
        ...

    async def load_questions_ordered(self, exam_id: UUID) -> list[QuestionEntity]:
        """Load full QuestionEntity objects for an exam, ordered by position."""
        ...
