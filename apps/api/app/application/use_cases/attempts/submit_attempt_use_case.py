from uuid import UUID

from app.core.datetime_utils import now_ict
from app.domain.value_objects import AttemptStatus
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository


class SubmitAttemptUseCase:
    def __init__(
        self,
        att_repo: AttemptRepository,
        eq_repo: ExamQuestionRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo

    async def execute(self, attempt_id: UUID, user_id: int):
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return None, "not_found"

        if att.status == AttemptStatus.COMPLETED:
            return att, "already_done"

        if att.status != AttemptStatus.IN_PROGRESS:
            return None, "bad_state"

        now = now_ict()
        questions = await self._eq_repo.load_questions_ordered(att.exam_id)
        answers_rows = await self._att_repo.list_answers(attempt_id)
        by_q = {a.question_id: a.selected_option_id for a in answers_rows}

        sc = att.score_attempt(questions, by_q)
        att.score = sc
        att.status = AttemptStatus.COMPLETED
        att.completed_at = now
        await self._att_repo.save(att)
        return att, "ok"
