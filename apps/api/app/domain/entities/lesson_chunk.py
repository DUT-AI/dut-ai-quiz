from dataclasses import dataclass
import hashlib
from uuid import UUID


@dataclass(slots=True)
class LessonChunkEntity:
    id: UUID
    lesson_id: UUID
    chunk_index: int
    content: str
    source_hash: str
    embedding: list[float]
    embedding_model: str


@dataclass(slots=True)
class LessonChunkMatch:
    lesson_id: UUID
    lesson_name: str
    lesson_description: str
    lesson_slug: str | None
    lesson_content_md: str
    chunk_content: str
    source_hash: str
    score: float


def lesson_source_hash(name: str, description: str, content_md: str) -> str:
    source = f"{name}\n{description}\n{content_md}"
    return hashlib.sha256(source.encode("utf-8")).hexdigest()
