from uuid import UUID

from app.domain.entities.question import QuestionEntity
from app.domain.interfaces import IQuestionRepository
from app.presentation.schemas.questions import QuestionListQuery


class GetQuestionUseCase:
    def __init__(self, question_repo: IQuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID) -> QuestionEntity | None:
        return await self._question_repo.get(question_id)


class ListQuestionsUseCase:
    def __init__(self, question_repo: IQuestionRepository):
        self._question_repo = question_repo

    async def execute(self, query: QuestionListQuery) -> list[QuestionEntity]:
        return await self._question_repo.list_all(
            pool_type=query.pool_type,
            difficulty=query.difficulty,
            lesson_id=query.lesson_id,
            tag=query.tag,
            offset=query.offset,
            limit=query.limit,
        )