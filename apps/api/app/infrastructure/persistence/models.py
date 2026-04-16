from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, String, UniqueConstraint, Integer
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel
from app.core.datetime_utils import now_ict


class PoolType(StrEnum):
    PRACTICE = "PRACTICE"
    EXAM = "EXAM"


class AttemptStatus(StrEnum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"
    ABANDONED = "ABANDONED"


class PracticeSessionStatus(StrEnum):
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class Question(SQLModel, table=True):
    __tablename__ = "questions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    pool_type: PoolType = Field(index=True)
    content: str = ""
    options: list[dict[str, Any]] = Field(
        default_factory=list, sa_column=Column(JSONB, nullable=False)
    )
    solution: str | None = None
    tags: list[str] = Field(
        default_factory=list, sa_column=Column(ARRAY(String()), nullable=False)
    )
    lesson_id: UUID | None = Field(default=None, foreign_key="lessons.id", index=True)
    created_at: datetime = Field(default_factory=now_ict)

    def to_entity(self) -> "QuestionEntity":
        from app.domain.entities.question import QuestionEntity

        return QuestionEntity(
            id=self.id,
            pool_type=self.pool_type,
            content=self.content,
            options=self.options,
            solution=self.solution,
            lesson_id=self.lesson_id,
            tags=self.tags,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: "QuestionEntity") -> "Question":
        return cls(
            id=entity.id,
            pool_type=entity.pool_type,
            content=entity.content,
            options=entity.options,
            solution=entity.solution,
            lesson_id=entity.lesson_id,
            tags=entity.tags,
            created_at=entity.created_at,
        )


class Exam(SQLModel, table=True):
    __tablename__ = "exams"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    title: str
    description: str = ""
    start_time: datetime | None = None
    end_time: datetime | None = None
    duration_minutes: int = 60
    max_attempts: int = 1
    is_published: bool = False
    created_by: int = Field(index=True)
    participant_ids: list[int] = Field(default_factory=list, sa_column=Column(ARRAY(Integer()), nullable=False))

    def to_entity(self) -> "ExamEntity":
        from app.domain.entities.exam import ExamEntity

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
    def from_entity(cls, entity: "ExamEntity") -> "Exam":
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


class ExamQuestion(SQLModel, table=True):
    __tablename__ = "exam_questions"
    __table_args__ = (
        UniqueConstraint("exam_id", "question_id", name="uq_exam_question"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    exam_id: UUID = Field(foreign_key="exams.id", index=True)
    question_id: UUID = Field(foreign_key="questions.id", index=True)
    position: int = 0


class Attempt(SQLModel, table=True):
    __tablename__ = "attempts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    exam_id: UUID = Field(foreign_key="exams.id", index=True)
    user_id: int = Field(index=True)
    started_at: datetime = Field(default_factory=now_ict)
    completed_at: datetime | None = None
    expires_at: datetime
    score: float | None = None
    status: AttemptStatus = Field(default=AttemptStatus.IN_PROGRESS, index=True)
    tab_out_count: int = 0
    shuffle_seed: int | None = None
    shuffle_snapshot: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )

    def to_entity(self) -> "AttemptEntity":
        from app.domain.entities.attempt import AttemptEntity

        return AttemptEntity(
            id=self.id,
            exam_id=self.exam_id,
            user_id=self.user_id,
            started_at=self.started_at,
            completed_at=self.completed_at,
            expires_at=self.expires_at,
            score=self.score,
            status=self.status,
            tab_out_count=self.tab_out_count,
            shuffle_seed=self.shuffle_seed,
            shuffle_snapshot=self.shuffle_snapshot,
        )

    @classmethod
    def from_entity(cls, entity: "AttemptEntity") -> "Attempt":
        return cls(
            id=entity.id,
            exam_id=entity.exam_id,
            user_id=entity.user_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            expires_at=entity.expires_at,
            score=entity.score,
            status=entity.status,
            tab_out_count=entity.tab_out_count,
            shuffle_seed=entity.shuffle_seed,
            shuffle_snapshot=entity.shuffle_snapshot,
        )


class AttemptAnswer(SQLModel, table=True):
    __tablename__ = "attempt_answers"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    attempt_id: UUID = Field(foreign_key="attempts.id", index=True)
    question_id: UUID = Field(foreign_key="questions.id", index=True)
    selected_option_id: str | None = None

    def to_entity(self) -> "AttemptAnswerEntity":
        from app.domain.entities.attempt import AttemptAnswerEntity

        return AttemptAnswerEntity(
            id=self.id,
            attempt_id=self.attempt_id,
            question_id=self.question_id,
            selected_option_id=self.selected_option_id,
        )

    @classmethod
    def from_entity(cls, entity: "AttemptAnswerEntity") -> "AttemptAnswer":
        return cls(
            id=entity.id,
            attempt_id=entity.attempt_id,
            question_id=entity.question_id,
            selected_option_id=entity.selected_option_id,
        )


class FocusEvent(SQLModel, table=True):
    __tablename__ = "focus_events"
    __table_args__ = (
        UniqueConstraint("attempt_id", "client_event_id", name="uq_focus_client"),
    )

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    attempt_id: UUID = Field(foreign_key="attempts.id", index=True)
    client_event_id: str
    event: str = ""
    received_at: datetime = Field(default_factory=now_ict)

    def to_entity(self) -> "FocusEventEntity":
        from app.domain.entities.attempt import FocusEventEntity

        return FocusEventEntity(
            id=self.id,
            attempt_id=self.attempt_id,
            client_event_id=self.client_event_id,
            event=self.event,
            received_at=self.received_at,
        )

    @classmethod
    def from_entity(cls, entity: "FocusEventEntity") -> "FocusEvent":
        return cls(
            id=entity.id,
            attempt_id=entity.attempt_id,
            client_event_id=entity.client_event_id,
            event=entity.event,
            received_at=entity.received_at,
        )


class PracticeSession(SQLModel, table=True):
    __tablename__ = "practice_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: int = Field(index=True)
    started_at: datetime = Field(default_factory=now_ict)
    completed_at: datetime | None = None
    status: PracticeSessionStatus = Field(default=PracticeSessionStatus.IN_PROGRESS)
    snapshot: dict[str, Any] | None = Field(
        default=None, sa_column=Column(JSONB, nullable=True)
    )
    tags_filter: list[str] = Field(
        default_factory=list, sa_column=Column(ARRAY(String()), nullable=False)
    )
    question_limit: int = 10

    def to_entity(self) -> "PracticeSessionEntity":
        from app.domain.entities.practice import PracticeSessionEntity

        return PracticeSessionEntity(
            id=self.id,
            user_id=self.user_id,
            started_at=self.started_at,
            completed_at=self.completed_at,
            status=self.status,
            snapshot=self.snapshot,
            tags_filter=self.tags_filter,
            question_limit=self.question_limit,
        )

    @classmethod
    def from_entity(cls, entity: "PracticeSessionEntity") -> "PracticeSession":
        return cls(
            id=entity.id,
            user_id=entity.user_id,
            started_at=entity.started_at,
            completed_at=entity.completed_at,
            status=entity.status,
            snapshot=entity.snapshot,
            tags_filter=entity.tags_filter,
            question_limit=entity.question_limit,
        )


class Lesson(SQLModel, table=True):
    __tablename__ = "lessons"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    name: str
    description: str = ""
    order: int = 0
    created_at: datetime = Field(default_factory=now_ict)

    def to_entity(self) -> "LessonEntity":
        from app.domain.entities.lesson import LessonEntity

        return LessonEntity(
            id=self.id,
            name=self.name,
            description=self.description,
            order=self.order,
            created_at=self.created_at,
        )

    @classmethod
    def from_entity(cls, entity: "LessonEntity") -> "Lesson":
        return cls(
            id=entity.id,
            name=entity.name,
            description=entity.description,
            order=entity.order,
            created_at=entity.created_at,
        )
