import hashlib
from dataclasses import dataclass
from typing import Any
from uuid import UUID


@dataclass(slots=True)
class LessonChunkEntity:
    id: UUID
    lesson_id: UUID
    chunk_index: int
    content: str
    contextual_content: str
    heading_path: tuple[str, ...]
    token_count: int
    metadata: dict[str, Any]
    source_hash: str
    embedding: list[float]
    embedding_model: str


def lesson_source_hash(name: str, description: str, content_md: str) -> str:
    """Return the source version used to detect stale lesson embeddings.

    The checksum changes whenever searchable lesson text changes. Search results
    whose checksum differs from the current lesson are ignored until the worker
    finishes re-indexing the latest version.
    """

    source = f"{name}\n{description}\n{content_md}"
    return hashlib.sha256(source.encode("utf-8")).hexdigest()
