from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository
from app.application.services.lesson_embedding_indexer import LessonEmbeddingIndexer
from app.presentation.schemas.lessons import LessonCreate


class CreateLessonUseCase:
    """Create a new lesson in the system."""

    def __init__(self, repo: ILessonRepository, indexer: LessonEmbeddingIndexer) -> None:
        self._repo = repo
        self._indexer = indexer

    async def execute(self, payload: LessonCreate) -> LessonEntity:
        """Execute the use case to create a lesson."""
        entity = LessonEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            content_md=payload.content_md or "",
            order=payload.order,
            slug=payload.slug,
            module_id=payload.module_id,
            created_at=now_ict(),
        )
        saved = await self._repo.add(entity)
        await self._indexer.index_if_enabled(saved)
        return saved
