from uuid import UUID, uuid4

from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import ILessonEssayQuestionRepository, ILessonRepository
from app.presentation.schemas.lessons import LessonEssayQuestionCreate


class SyncLessonEssayQuestionsUseCase:
    """Atomically synchronize the ordered Markdown essay questions for a lesson."""

    def __init__(
        self,
        lesson_repo: ILessonRepository,
        essay_question_repo: ILessonEssayQuestionRepository,
    ) -> None:
        self._lesson_repo = lesson_repo
        self._essay_question_repo = essay_question_repo

    async def execute(
        self, lesson_id: UUID, items: list[LessonEssayQuestionCreate]
    ) -> list[LessonEssayQuestionEntity]:
        lesson = await self._lesson_repo.get(lesson_id)
        if not lesson:
            raise NotFoundException("Lesson not found!")

        entities: list[LessonEssayQuestionEntity] = []
        for index, item in enumerate(items):
            question_md = item.question_md.strip()
            answer_md = item.answer_md.strip()
            if not question_md or not answer_md:
                raise ValueError(
                    "Question and reference answer Markdown must not be empty"
                )

            entities.append(
                LessonEssayQuestionEntity(
                    id=item.id or uuid4(),
                    lesson_id=lesson_id,
                    question_md=question_md,
                    answer_md=answer_md,
                    order=index,
                )
            )

        return await self._essay_question_repo.replace_lesson_essay_questions(
            lesson_id, entities
        )
