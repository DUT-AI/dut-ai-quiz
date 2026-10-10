from typing import Any
from uuid import UUID, uuid4

from pgvector.sqlalchemy import Vector
from sqlalchemy import ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.dialects.postgresql import UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class LessonChunk(Base):
    """A heading-aware, independently embedded section of a lesson."""

    __tablename__ = "lesson_chunks"
    __table_args__ = (
        Index(
            "uq_lesson_chunks_lesson_chunk_index",
            "lesson_id",
            "chunk_index",
            unique=True,
        ),
        Index(
            "ix_lesson_chunks_embedding_hnsw",
            "embedding",
            postgresql_using="hnsw",
            postgresql_ops={"embedding": "vector_cosine_ops"},
        ),
    )

    id: Mapped[UUID] = mapped_column(pgUUID(as_uuid=True), primary_key=True, default=uuid4)
    lesson_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    contextual_content: Mapped[str] = mapped_column(Text, nullable=False)
    heading_path: Mapped[list[str]] = mapped_column(JSONB, nullable=False, default=list)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False)
    chunk_metadata: Mapped[dict[str, Any]] = mapped_column(
        "metadata", JSONB, nullable=False, default=dict
    )
    source_hash: Mapped[str] = mapped_column(
        String(64),
        nullable=False,
        index=True,
        comment=(
            "SHA-256 of lesson name, description and Markdown content; used to "
            "reject stale embeddings while a newer version is being indexed"
        ),
    )
    embedding: Mapped[list[float]] = mapped_column(Vector(1024), nullable=False)
    embedding_model: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
