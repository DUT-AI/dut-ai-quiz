from datetime import datetime
from typing import Any
from uuid import UUID, uuid4

import sqlalchemy
from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, String
from sqlalchemy.dialects.postgresql import ARRAY, JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from app.core.datetime_utils import now_ict
from app.domain.entities.question import (
    DuplicateStatus,
    QuestionEntity,
    QuestionOptionEntity,
    QuestionStatus,
)
from app.domain.value_objects import Difficulty, PoolType

from .base import Base


class Question(Base):
    __tablename__ = "questions"
    __table_args__ = (
        Index(
            "ix_questions_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    pool_type: Mapped[PoolType] = mapped_column(index=True)
    difficulty: Mapped[Difficulty] = mapped_column(
        default=Difficulty.EASY,
        server_default=Difficulty.EASY.value,
        index=True,
    )
    content: Mapped[str] = mapped_column(default="", server_default="")
    options: Mapped[list[dict[str, Any]]] = mapped_column(JSONB, nullable=False, default=list)
    solution: Mapped[str | None] = mapped_column(nullable=True)
    tags: Mapped[list[UUID]] = mapped_column(
        ARRAY(pgUUID(as_uuid=True)), nullable=False, default=list
    )
    lesson_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        index=True,
        nullable=True,
    )
    created_by: Mapped[int] = mapped_column(index=True)
    created_at: Mapped[datetime] = mapped_column(default=now_ict)
    embedding: Mapped[list[float] | None] = mapped_column(Vector(1024), nullable=True)
    embedding_model: Mapped[str | None] = mapped_column(String(200), nullable=True)
    embedding_source_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)
    status: Mapped[QuestionStatus] = mapped_column(
        sqlalchemy.Enum(QuestionStatus, native_enum=False, length=50),
        default=QuestionStatus.PUBLIC,
        server_default=QuestionStatus.PUBLIC.value,
        index=True,
    )
    duplicate_status: Mapped[DuplicateStatus] = mapped_column(
        sqlalchemy.Enum(DuplicateStatus, native_enum=False, length=50),
        default=DuplicateStatus.NONE,
        server_default=DuplicateStatus.NONE.value,
    )
    duplicate_of_question_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("questions.id", ondelete="SET NULL"),
        nullable=True,
    )
    is_difficulty_ai_suggested: Mapped[bool] = mapped_column(default=False, server_default="false")
    is_answer_ai_generated: Mapped[bool] = mapped_column(default=False, server_default="false")
    is_solution_ai_generated: Mapped[bool] = mapped_column(default=False, server_default="false")
    import_session_id: Mapped[UUID | None] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("import_sessions.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    review_locked_by: Mapped[int | None] = mapped_column(nullable=True)
    review_locked_at: Mapped[datetime | None] = mapped_column(nullable=True)

    def to_entity(self) -> QuestionEntity:
        return QuestionEntity(
            id=self.id,
            pool_type=self.pool_type,
            difficulty=self.difficulty,
            content=self.content,
            options=[QuestionOptionEntity.from_dict(opt) for opt in self.options],
            solution=self.solution,
            lesson_id=self.lesson_id,
            tags=self.tags,
            created_by=self.created_by,
            created_at=self.created_at,
            embedding=self.embedding,
            embedding_model=self.embedding_model,
            embedding_source_hash=self.embedding_source_hash,
            status=self.status,
            duplicate_status=self.duplicate_status,
            duplicate_of_question_id=self.duplicate_of_question_id,
            is_difficulty_ai_suggested=self.is_difficulty_ai_suggested,
            is_answer_ai_generated=self.is_answer_ai_generated,
            is_solution_ai_generated=self.is_solution_ai_generated,
            import_session_id=self.import_session_id,
            review_locked_by=self.review_locked_by,
            review_locked_at=self.review_locked_at,
        )

    @classmethod
    def from_entity(cls, entity: QuestionEntity) -> "Question":
        return cls(
            id=entity.id,
            pool_type=entity.pool_type,
            difficulty=entity.difficulty,
            content=entity.content,
            options=[opt.to_dict() for opt in entity.options],
            solution=entity.solution,
            lesson_id=entity.lesson_id,
            tags=entity.tags,
            created_by=entity.created_by,
            created_at=entity.created_at,
            embedding=entity.embedding,
            embedding_model=entity.embedding_model,
            embedding_source_hash=entity.embedding_source_hash,
            status=entity.status,
            duplicate_status=entity.duplicate_status,
            duplicate_of_question_id=entity.duplicate_of_question_id,
            is_difficulty_ai_suggested=entity.is_difficulty_ai_suggested,
            is_answer_ai_generated=entity.is_answer_ai_generated,
            is_solution_ai_generated=entity.is_solution_ai_generated,
            import_session_id=entity.import_session_id,
            review_locked_by=entity.review_locked_by,
            review_locked_at=entity.review_locked_at,
        )
