from uuid import UUID

from app.domain.interfaces import IAttemptRepository, IExamQuestionRepository


class RescoreAttemptUseCase:
    def __init__(
        self,
        att_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo

    async def execute(self, attempt_id: UUID) -> bool:
        att = await self._att_repo.get(attempt_id)
        if not att:
            return False

        # 1. Load questions using original exam question set
        questions = await self._eq_repo.load_questions_ordered(att.exam_id)

        # 2. Load answers
        answers_rows = await self._att_repo.list_answers(attempt_id)
        answers_by_q = {a.question_id: a.selected_option_id for a in answers_rows}

        # 3. Re-score
        score = att.score_attempt(questions, answers_by_q)

        # 4. Update and Save
        att.score = score
        await self._att_repo.save(att)
        return True
