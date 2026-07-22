from dataclasses import dataclass
from typing import Any
from uuid import UUID


@dataclass(frozen=True, slots=True)
class LessonChunkDraft:
    """Immutable chunk produced from one Markdown section before persistence."""

    content: str
    contextual_content: str
    heading_path: tuple[str, ...]
    token_count: int
    metadata: dict[str, Any]


@dataclass(frozen=True, slots=True)
class LessonChunkMatch:
    """Read-only nearest-neighbour result returned by the chunk repository."""

    lesson_id: UUID
    lesson_name: str
    lesson_description: str
    lesson_slug: str | None
    lesson_content_md: str
    chunk_content: str
    heading_path: tuple[str, ...]
    source_hash: str
    score: float
