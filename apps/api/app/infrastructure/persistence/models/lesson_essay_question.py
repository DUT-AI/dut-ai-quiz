from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity

from .base import Base


class LessonEssayQuestion(Base):
    """SQLAlchemy model representing an essay reflection question attached to a lesson."""

    __tablename__ = "lesson_essay_questions"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    lesson_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        index=True,
        nullable=False,
    )
    question_md: Mapped[str] = mapped_column(Text, nullable=False)
    answer_md: Mapped[str] = mapped_column(Text, nullable=False)
    order: Mapped[int] = mapped_column(
        Integer, default=0, server_default="0", nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(default=now_ict, nullable=False)
    updated_at: Mapped[datetime] = mapped_column(
        default=now_ict, onupdate=now_ict, nullable=False
    )

    def to_entity(self) -> LessonEssayQuestionEntity:
        """Convert database model to domain entity."""
        return LessonEssayQuestionEntity(
            id=self.id,
            lesson_id=self.lesson_id,
            question_md=self.question_md,
            answer_md=self.answer_md,
            order=self.order,
            created_at=self.created_at,
            updated_at=self.updated_at,
        )

    @classmethod
    def from_entity(cls, entity: LessonEssayQuestionEntity) -> "LessonEssayQuestion":
        """Create database model from domain entity."""
        now = now_ict()
        return cls(
            id=entity.id,
            lesson_id=entity.lesson_id,
            question_md=entity.question_md,
            answer_md=entity.answer_md,
            order=entity.order,
            created_at=entity.created_at or now,
            updated_at=entity.updated_at or now,
        )
