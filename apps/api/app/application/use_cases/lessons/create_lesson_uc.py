from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository
from app.presentation.schemas.lessons import LessonCreate


class CreateLessonUseCase:
    """Create a new lesson in the system."""

    def __init__(self, repo: ILessonRepository) -> None:
        self._repo = repo

    async def execute(self, payload: LessonCreate) -> LessonEntity:
        """Execute the use case to create a lesson."""
        entity = LessonEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            content_md=payload.content_md,
            order=payload.order,
            slug=payload.slug,
            module_id=payload.module_id,
            created_at=now_ict(),
        )
        return await self._repo.add(entity)
