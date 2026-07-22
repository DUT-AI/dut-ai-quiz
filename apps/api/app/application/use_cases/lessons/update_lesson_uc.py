from uuid import UUID

from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository
from app.application.services.lesson_index_scheduler import LessonIndexScheduler
from app.presentation.schemas.lessons import LessonUpdate


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
        if payload.slug is not None:
            entity.slug = payload.slug
        if "module_id" in payload.model_fields_set:
            entity.module_id = payload.module_id

        saved = await self._repo.update(entity)
        if any(
            value is not None
            for value in (payload.name, payload.description, payload.content_md)
        ):
            await self._scheduler.schedule(saved)
        return saved
