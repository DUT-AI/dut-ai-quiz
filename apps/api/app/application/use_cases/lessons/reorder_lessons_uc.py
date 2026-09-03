from app.domain.interfaces import ILessonRepository
from app.presentation.schemas.lessons import LessonReorder


class ReorderLessonsUseCase:
    """Reorder multiple lessons in the system."""

    def __init__(self, repo: ILessonRepository) -> None:
        self._repo = repo

    async def execute(self, payload: LessonReorder) -> None:
        """Execute the use case to update lesson orders and module_id."""
        for item in payload.items:
            entity = await self._repo.get(item.id)
            if entity:
                entity.order = item.order
                entity.module_id = item.module_id
                await self._repo.update(entity)
