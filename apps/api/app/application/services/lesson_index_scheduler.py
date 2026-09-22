from app.domain.entities.lesson import LessonEntity
from app.domain.entities.lesson_chunk import lesson_source_hash
from app.domain.interfaces import IEmbeddingService, ILessonIndexQueue
from loguru import logger


class LessonIndexScheduler:
    """Schedule slow lesson embedding work without blocking API requests."""

    def __init__(
        self,
        queue: ILessonIndexQueue,
        embedding_service: IEmbeddingService,
    ) -> None:
        self._queue = queue
        self._embedding_service = embedding_service

    @property
    def enabled(self) -> bool:
        return self._embedding_service.enabled

    async def schedule(self, lesson: LessonEntity) -> bool:
        if not self.enabled:
            return False
        source_hash = lesson_source_hash(lesson.name, lesson.description, lesson.content_md or "")
        try:
            await self._queue.enqueue_index(lesson.id, source_hash)
            return True
        except Exception as exc:
            # Editing lesson content must remain possible during a Redis outage.
            logger.warning("Could not enqueue lesson {} for indexing: {}", lesson.id, exc)
            return False
