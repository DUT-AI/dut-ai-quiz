from uuid import UUID
from app.infrastructure.repositories.questions import QuestionRepository


class DeleteQuestionUseCase:
    def __init__(self, question_repo: QuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID) -> bool:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return False

        await self._question_repo.delete(entity)
        return True
