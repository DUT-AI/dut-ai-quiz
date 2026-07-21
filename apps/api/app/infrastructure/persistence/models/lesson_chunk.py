from uuid import UUID, uuid4

from sqlalchemy import Float, ForeignKey, Index, Integer, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID as pgUUID
from sqlalchemy.orm import Mapped, mapped_column

from .base import Base


class LessonChunk(Base):
    """A searchable, independently embedded section of a lesson."""

    __tablename__ = "lesson_chunks"
    __table_args__ = (
        Index(
            "uq_lesson_chunks_lesson_chunk_index",
            "lesson_id",
            "chunk_index",
            unique=True,
        ),
    )

    id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True), primary_key=True, default=uuid4
    )
    lesson_id: Mapped[UUID] = mapped_column(
        pgUUID(as_uuid=True),
        ForeignKey("lessons.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    source_hash: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    embedding: Mapped[list[float]] = mapped_column(
        ARRAY(Float), nullable=False
    )
    embedding_model: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
