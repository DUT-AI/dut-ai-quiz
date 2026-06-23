from datetime import datetime
from uuid import UUID, uuid4

from sqlalchemy import ForeignKey, Integer, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.domain.entities.exam import ExamEntity

from .base import Base


class Exam(Base):
    __tablename__ = "exams"

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    title: Mapped[str] = mapped_column()
    description: Mapped[str] = mapped_column(default="", server_default="")
    start_time: Mapped[datetime | None] = mapped_column(nullable=True)
    end_time: Mapped[datetime | None] = mapped_column(nullable=True)
    duration_minutes: Mapped[int] = mapped_column(default=60, server_default="60")
    max_attempts: Mapped[int] = mapped_column(default=1, server_default="1")
    is_published: Mapped[bool] = mapped_column(default=False, server_default="false")
    created_by: Mapped[int] = mapped_column(index=True)
    participant_ids: Mapped[list[int]] = mapped_column(
        ARRAY(Integer()), nullable=False, default=list
    )

    def to_entity(self) -> "ExamEntity":
        return ExamEntity(
            id=self.id,
            title=self.title,
            description=self.description,
            start_time=self.start_time,
            end_time=self.end_time,
            duration_minutes=self.duration_minutes,
            max_attempts=self.max_attempts,
            is_published=self.is_published,
            created_by=self.created_by,
            participant_ids=self.participant_ids,
        )

    @classmethod
    def from_entity(cls, entity: ExamEntity) -> "Exam":
        return cls(
            id=entity.id,
            title=entity.title,
            description=entity.description,
            start_time=entity.start_time,
            end_time=entity.end_time,
            duration_minutes=entity.duration_minutes,
            max_attempts=entity.max_attempts,
            is_published=entity.is_published,
            created_by=entity.created_by,
            participant_ids=entity.participant_ids,
        )


class ExamQuestion(Base):
    __tablename__ = "exam_questions"
    __table_args__ = (
        UniqueConstraint("exam_id", "question_id", name="uq_exam_question"),
    )

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    exam_id: Mapped[UUID] = mapped_column(ForeignKey("exams.id"), index=True)
    question_id: Mapped[UUID] = mapped_column(ForeignKey("questions.id"), index=True)
    position: Mapped[int] = mapped_column(default=0, server_default="0")
