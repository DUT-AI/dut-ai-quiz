from typing import Protocol
from uuid import UUID

from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity


class ILessonEssayQuestionRepository(Protocol):
    """Interface protocol for LessonEssayQuestionRepository operations."""

    async def list_by_lesson_id(
        self, lesson_id: UUID
    ) -> list[LessonEssayQuestionEntity]:
        """List all essay questions for a lesson ordered by order ASC, created_at ASC."""
        ...

    async def replace_lesson_essay_questions(
        self, lesson_id: UUID, items: list[LessonEssayQuestionEntity]
    ) -> list[LessonEssayQuestionEntity]:
        """Atomically synchronize all essay questions for a lesson."""
        ...
