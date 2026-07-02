from uuid import UUID

from sqlalchemy.exc import IntegrityError

from app.domain.interfaces import ILessonRepository


class DeleteLessonUseCase:
    """Delete a lesson from the system."""

    def __init__(self, repo: ILessonRepository) -> None:
        self._repo = repo

    async def execute(self, lesson_id: str) -> bool:
        """Execute the use case to delete the lesson."""
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return False

        try:
            await self._repo.delete(entity)
            return True
        except IntegrityError as e:
            # Foreign key constraint violation
            if "questions_lesson_id_fkey" in str(e):
                raise ValueError(
                    "Cannot delete lesson because it has associated questions. "
                    "Please delete all questions first or set their lesson_id to NULL."
                )
            raise
