from uuid import UUID

from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository
from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.presentation.schemas.lessons import LessonUpdate
from app.core.string_utils import slugify_vietnamese


class UpdateLessonUseCase:
    """Update an existing lesson in the system."""

    def __init__(self, repo: ILessonRepository, scheduler: LessonIndexScheduler) -> None:
        self._repo = repo
        self._scheduler = scheduler

    async def execute(
        self, lesson_id: str, payload: LessonUpdate
    ) -> LessonEntity | None:
        """Execute the use case to update the lesson."""
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return None

        if payload.name is not None:
            entity.name = payload.name
        if payload.description is not None:
            entity.description = payload.description
        if payload.content_md is not None:
            entity.content_md = payload.content_md
        if payload.order is not None:
            entity.order = payload.order
        if "module_id" in payload.model_fields_set:
            entity.module_id = payload.module_id

        # Generate slug if it is empty/null in the database or if it is explicitly passed
        slug_passed = "slug" in payload.model_fields_set
        should_update_slug = slug_passed or not entity.slug or not entity.slug.strip()

        if should_update_slug:
            slug = payload.slug if slug_passed else entity.slug
            if not slug or not slug.strip():
                slug = slugify_vietnamese(entity.name)
            
            # Ensure slug is unique (allow own slug)
            base_slug = slug
            counter = 1
            while True:
                existing = await self._repo.get_by_slug(slug)
                if existing is None or existing.id == entity.id:
                    break
                slug = f"{base_slug}-{counter}"
                counter += 1
            entity.slug = slug

        saved = await self._repo.update(entity)
        if any(
            value is not None
            for value in (payload.name, payload.description, payload.content_md)
        ):
            await self._scheduler.schedule(saved)
        return saved
