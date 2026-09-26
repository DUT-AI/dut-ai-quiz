from uuid import UUID

from app.domain.interfaces import ILessonRepository


class DeleteLessonUseCase:
    """Delete a lesson from the system. Cascades to delete associated questions, chunks, homeworks, and comments."""

    def __init__(self, repo: ILessonRepository) -> None:
        self._repo = repo

    async def execute(self, lesson_id: str) -> bool:
        """Execute the use case to delete the lesson."""
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return False

        await self._repo.delete(entity)
        return True

