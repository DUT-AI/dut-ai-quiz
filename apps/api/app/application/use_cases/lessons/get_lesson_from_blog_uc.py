from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.value_objects import PoolType
from app.infrastructure.clients.blog_service import BlogServiceClient
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.questions import QuestionRepository


class GetLessonBySlugUseCase:
    """
    Get lesson by slug.
    If lesson not found locally, fetch from blog service and create it.
    """

    def __init__(
        self,
        lesson_repo: LessonRepository,
        question_repo: QuestionRepository,
        blog_client: BlogServiceClient,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo
        self._blog_client = blog_client

    async def execute(self, slug: str, is_teacher: bool = False) -> dict | None:
        # Try to find lesson by slug locally
        lesson = await self._lesson_repo.get_by_slug(slug)

        # If not found, try to fetch from blog service and create
        if not lesson:
            # Get all blogs to find the one with matching slug
            blogs = await self._blog_client.get_all_blogs()
            if not blogs:
                return None

            # Find blog with matching slug
            matching_blog = None
            for blog in blogs:
                if blog.get("slug") == slug:
                    matching_blog = blog
                    break

            if not matching_blog:
                return None

            # Get full blog details
            blog_id = matching_blog.get("id")
            blog_detail = await self._blog_client.get_blog_by_id(blog_id)
            if not blog_detail:
                return None

            # Create lesson from blog
            lesson = LessonEntity(
                id=uuid4(),
                name=blog_detail.get("title", ""),
                description=blog_detail.get("excerpt", ""),
                content_md=blog_detail.get("content", ""),
                order=0,
                slug=slug,
                blog_id=blog_id,
                created_at=now_ict(),
            )

            # Save to database
            lesson = await self._lesson_repo.add(lesson)

        # Get questions for the lesson
        pool_type = None if is_teacher else PoolType.PRACTICE
        questions = await self._question_repo.list_all(
            lesson_id=lesson.id, pool_type=pool_type
        )

        return {
            "id": lesson.id,
            "name": lesson.name,
            "description": lesson.description,
            "content_md": lesson.content_md,
            "order": lesson.order,
            "slug": lesson.slug,
            "blog_id": lesson.blog_id,
            "created_at": lesson.created_at,
            "questions": questions,
        }
