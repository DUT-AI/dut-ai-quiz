from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonRepository, IQuestionRepository
from app.domain.value_objects import PoolType


class GetLessonBySlugUseCase:
    """Read a lesson and its locally managed Markdown content by slug."""

    def __init__(
        self, lesson_repo: ILessonRepository, question_repo: IQuestionRepository
    ) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo

    async def execute(self, slug: str):
        lesson = await self._lesson_repo.get_by_slug(slug)
        if not lesson:
            raise NotFoundException("Lesson not found!")

        game_questions = await self._question_repo.list_all(
            pool_type=PoolType.GAME,
            lesson_id=lesson.id,
            limit=1,
        )
        has_game_questions = len(game_questions) > 0

        return {
            "id": lesson.id,
            "name": lesson.name,
            "description": lesson.description,
            "content_md": lesson.content_md,
            "order": lesson.order,
            "slug": lesson.slug,
            "created_at": lesson.created_at,
            "module_id": lesson.module_id,
            "has_game_questions": has_game_questions,
            "questions": [],
        }

