from uuid import uuid4

from loguru import logger

from app.domain.entities.lesson import LessonEntity
from app.domain.entities.lesson_chunk import LessonChunkEntity, lesson_source_hash
from app.domain.interfaces import (
    EmbeddingServiceError,
    IEmbeddingService,
    ILessonChunkRepository,
)

from .lesson_chunker import LessonChunker


class LessonEmbeddingIndexer:
    def __init__(
        self,
        chunk_repo: ILessonChunkRepository,
        embedding_service: IEmbeddingService,
        chunker: LessonChunker,
    ) -> None:
        self._chunk_repo = chunk_repo
        self._embedding_service = embedding_service
        self._chunker = chunker

    @property
    def enabled(self) -> bool:
        return self._embedding_service.enabled

    async def index(self, lesson: LessonEntity) -> int:
        content = lesson.content_md or ""
        chunks = self._chunker.split(content)
        if not chunks:
            await self._chunk_repo.delete_for_lesson(lesson.id)
            return 0

        context = f"Bài học: {lesson.name}\nMô tả: {lesson.description}\n\n"
        vectors = await self._embedding_service.embed(
            [f"{context}{chunk}" for chunk in chunks]
        )
        source_hash = lesson_source_hash(
            lesson.name, lesson.description, content
        )
        entities = [
            LessonChunkEntity(
                id=uuid4(),
                lesson_id=lesson.id,
                chunk_index=index,
                content=chunk,
                source_hash=source_hash,
                embedding=vector,
                embedding_model=self._embedding_service.model_name,
            )
            for index, (chunk, vector) in enumerate(zip(chunks, vectors, strict=True))
        ]
        await self._chunk_repo.replace_for_lesson(lesson.id, entities)
        return len(entities)

    async def index_if_enabled(self, lesson: LessonEntity) -> int | None:
        if not self.enabled:
            return None
        try:
            return await self.index(lesson)
        except EmbeddingServiceError as exc:
            # Saving content must remain possible during an embedding outage.
            # source_hash validation prevents stale chunks from being returned.
            logger.warning("Could not index lesson {}: {}", lesson.id, exc)
            return None
