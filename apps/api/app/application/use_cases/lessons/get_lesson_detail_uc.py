from uuid import UUID

from app.domain.interfaces import ILessonRepository, IQuestionRepository
from app.domain.value_objects import PoolType


class GetLessonDetailUseCase:
    """Get the detail of a lesson including its questions."""

    def __init__(self, lesson_repo: ILessonRepository, question_repo: IQuestionRepository) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo

    async def execute(self, lesson_id: str, is_teacher: bool = False) -> dict | None:
        """Execute the use case to retrieve lesson details."""
        try:
            lid = UUID(lesson_id)
        except ValueError:
            return None

        lesson = await self._lesson_repo.get(lid)
        if not lesson:
            return None

        # Only show PRACTICE questions for students.
        pool_type = None if is_teacher else PoolType.PRACTICE
        questions = await self._question_repo.list_all(lesson_id=lid, pool_type=pool_type)

        # Check if lesson has game questions
        game_questions = await self._question_repo.list_all(
            lesson_id=lid, pool_type=PoolType.GAME, limit=1
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
            "questions": questions,
            "has_game_questions": has_game_questions,
        }
