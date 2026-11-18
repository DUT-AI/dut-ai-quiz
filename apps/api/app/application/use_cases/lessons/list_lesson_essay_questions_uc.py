from uuid import UUID

from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonEssayQuestionRepository, ILessonRepository


class ListLessonEssayQuestionsUseCase:
    """List all essay reflection questions for a lesson in display order."""

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        essay_question_repo: ILessonEssayQuestionRepository,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._essay_question_repo = essay_question_repo

    async def execute(self, lesson_id: UUID) -> list[LessonEssayQuestionEntity]:
        lesson = await self._lesson_repo.get(lesson_id)
        if not lesson:
            raise NotFoundException("Lesson not found!")

        return await self._essay_question_repo.list_by_lesson_id(lesson_id)
