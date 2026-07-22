from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository
from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.presentation.schemas.lessons import LessonCreate


class CreateLessonUseCase:
    """Create a new lesson in the system."""

    def __init__(self, repo: ILessonRepository, scheduler: LessonIndexScheduler) -> None:
        self._repo = repo
        self._scheduler = scheduler

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
        await self._scheduler.schedule(saved)
        return saved
