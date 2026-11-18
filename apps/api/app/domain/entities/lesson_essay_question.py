from dataclasses import dataclass
from datetime import datetime
from uuid import UUID


@dataclass
class LessonEssayQuestionEntity:
    """Domain entity representing a Markdown essay reflection question attached to a lesson."""

    id: UUID
    lesson_id: UUID
    question_md: str
    answer_md: str
    order: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None
