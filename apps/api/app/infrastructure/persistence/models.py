from datetime import datetime
from enum import StrEnum
from typing import Any
from uuid import UUID, uuid4

from sqlalchemy import Column, String, UniqueConstraint
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlmodel import Field, SQLModel


class PoolType(StrEnum):
    PRACTICE = "PRACTICE"
    EXAM = "EXAM"


class Difficulty(StrEnum):
    EASY = "EASY"
    MEDIUM = "MEDIUM"
    HARD = "HARD"


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
    options: list[dict[str, Any]] = Field(default_factory=list, sa_column=Column(JSONB, nullable=False))
    solution: str | None = None
    difficulty: Difficulty = Field(index=True)
    tags: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String()), nullable=False))
    created_at: datetime = Field(default_factory=datetime.utcnow)


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


class ExamQuestion(SQLModel, table=True):
    __tablename__ = "exam_questions"
    __table_args__ = (UniqueConstraint("exam_id", "question_id", name="uq_exam_question"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    exam_id: UUID = Field(foreign_key="exams.id", index=True)
    question_id: UUID = Field(foreign_key="questions.id", index=True)
    position: int = 0


class Attempt(SQLModel, table=True):
    __tablename__ = "attempts"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    exam_id: UUID = Field(foreign_key="exams.id", index=True)
    user_id: int = Field(index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    expires_at: datetime
    score: float | None = None
    status: AttemptStatus = Field(default=AttemptStatus.IN_PROGRESS, index=True)
    tab_out_count: int = 0
    shuffle_seed: int | None = None
    shuffle_snapshot: dict[str, Any] | None = Field(default=None, sa_column=Column(JSONB, nullable=True))


class AttemptAnswer(SQLModel, table=True):
    __tablename__ = "attempt_answers"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    attempt_id: UUID = Field(foreign_key="attempts.id", index=True)
    question_id: UUID = Field(foreign_key="questions.id", index=True)
    selected_option_id: str | None = None


class FocusEvent(SQLModel, table=True):
    __tablename__ = "focus_events"
    __table_args__ = (UniqueConstraint("attempt_id", "client_event_id", name="uq_focus_client"),)

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    attempt_id: UUID = Field(foreign_key="attempts.id", index=True)
    client_event_id: str
    event: str = ""
    received_at: datetime = Field(default_factory=datetime.utcnow)


class PracticeSession(SQLModel, table=True):
    __tablename__ = "practice_sessions"

    id: UUID = Field(default_factory=uuid4, primary_key=True)
    user_id: int = Field(index=True)
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: datetime | None = None
    status: PracticeSessionStatus = Field(default=PracticeSessionStatus.IN_PROGRESS)
    snapshot: dict[str, Any] | None = Field(default=None, sa_column=Column(JSONB, nullable=True))
    tags_filter: list[str] = Field(default_factory=list, sa_column=Column(ARRAY(String()), nullable=False))
    difficulty_filter: Difficulty | None = None
    question_limit: int = 10
