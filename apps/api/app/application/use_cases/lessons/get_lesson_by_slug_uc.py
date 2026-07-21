from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonRepository


class GetLessonBySlugUseCase:
    """Read a lesson and its locally managed Markdown content by slug."""

    def __init__(self, lesson_repo: ILessonRepository) -> None:
        self._lesson_repo = lesson_repo

    async def execute(self, slug: str):
        lesson = await self._lesson_repo.get_by_slug(slug)
        if not lesson:
            raise NotFoundException("Lesson not found!")
        return lesson
