from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.core.string_utils import slugify_vietnamese
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
        slug = payload.slug
        if not slug or not slug.strip():
            slug = slugify_vietnamese(payload.name)
            
        # Ensure slug is unique
        base_slug = slug
        counter = 1
        while await self._repo.get_by_slug(slug) is not None:
            slug = f"{base_slug}-{counter}"
            counter += 1

        entity = LessonEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            content_md=payload.content_md or "",
            order=payload.order,
            slug=slug,
            module_id=payload.module_id,
            created_at=now_ict(),
        )
        saved = await self._repo.add(entity)
        await self._scheduler.schedule(saved)
        return saved
