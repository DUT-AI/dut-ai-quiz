from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository


class ListLessonsUseCase:
    """List all lessons in the system."""

    def __init__(self, repo: ILessonRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[LessonEntity]:
        """Execute the usecase to list all lessons."""
        return await self._repo.list_all()
