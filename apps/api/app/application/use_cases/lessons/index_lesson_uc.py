from uuid import UUID

from app.application.services.lesson_embedding_indexer import LessonEmbeddingIndexer
from app.domain.interfaces import ILessonRepository


class IndexLessonUseCase:
    def __init__(
        self, lesson_repo: ILessonRepository, indexer: LessonEmbeddingIndexer
    ) -> None:
        self._lesson_repo = lesson_repo
        self._indexer = indexer

    async def execute(self, lesson_id: UUID) -> dict | None:
        lesson = await self._lesson_repo.get(lesson_id)
        if lesson is None:
            return None
        count = await self._indexer.index(lesson)
        return {"lesson_id": lesson.id, "chunks_indexed": count}
