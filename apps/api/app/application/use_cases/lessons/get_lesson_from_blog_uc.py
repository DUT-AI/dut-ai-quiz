from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonRepository, IQuestionRepository
from app.infrastructure.clients.blog_service import BlogServiceClient


class GetLessonBySlugUseCase:
    """
    Get lesson by slug.
    """

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        question_repo: IQuestionRepository,
        blog_client: BlogServiceClient,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo
        self._blog_client = blog_client

    async def execute(self, slug: str):
        """Execute the use case to get a lesson by slug."""
        lesson = await self._lesson_repo.get_by_slug(slug)

        if not lesson:
            raise NotFoundException("Lesson not found!")
        blog_detail = await self._blog_client.get_blog_by_slug(slug)
        if blog_detail:
            lesson.content_md = blog_detail.get("content")

        return lesson
