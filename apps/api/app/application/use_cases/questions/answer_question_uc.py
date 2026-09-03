from uuid import UUID
from app.domain.interfaces import IQuestionRepository


class AnswerQuestionUseCase:
    """Validate a question answer and return correctness, correct option, and explanation."""

    def __init__(self, question_repo: IQuestionRepository):
        self._question_repo = question_repo

    async def execute(self, question_id: UUID, option_id: str) -> dict | None:
        q = await self._question_repo.get(question_id)
        if not q:
            return None

        correct_option_id = None
        for opt in q.options:
            if opt.is_correct:
                correct_option_id = opt.id
                break

        is_correct = str(option_id) == str(correct_option_id)
        return {
            "is_correct": is_correct,
            "correct_option_id": str(correct_option_id) if correct_option_id else "",
            "solution": q.solution,
        }
