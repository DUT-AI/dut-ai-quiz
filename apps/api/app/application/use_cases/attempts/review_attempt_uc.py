from uuid import UUID

from app.domain.exceptions.exceptions import (
    AttemptNotCompletedException,
    AttemptNotFoundException,
    ReviewLockedException,
)
from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
    IQuestionRepository,
)
from app.domain.value_objects import AttemptStatus


class ReviewAttemptUseCase:
    def __init__(
        self,
        att_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
        exam_repo: IExamRepository,
        question_repo: IQuestionRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo
        self._exam_repo = exam_repo
        self._question_repo = question_repo

    async def execute(self, attempt_id: UUID, user_id: int) -> dict:
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            raise AttemptNotFoundException()

        # Only allow review if COMPLETED
        if att.status != AttemptStatus.COMPLETED:
            raise AttemptNotCompletedException()

        # Block review until exam window fully closes (end_time + duration)
        exam = await self._exam_repo.get(att.exam_id)
        if exam and exam.check_review_lock_status():
            raise ReviewLockedException()

        answers = await self._att_repo.list_answers(attempt_id)

        # Reconstruct presentation according to student's shuffle snapshot if available
        if att.shuffle_snapshot and att.shuffle_snapshot.question_order:
            ids = [UUID(x) for x in att.shuffle_snapshot.question_order]
            loaded_questions = await self._question_repo.get_by_ids(ids)
            q_map = {q.id: q for q in loaded_questions}
            questions = att.shuffle_snapshot.reconstruct_review_questions(q_map)
        else:
            questions = await self._eq_repo.load_questions_ordered(att.exam_id)

        # Backfill correct_count and total_questions if null (legacy attempts)
        if att.total_questions is None or att.correct_count is None:
            by_q = {a.question_id: a.selected_option_id for a in answers}
            att.score_attempt(questions, by_q)

        return {
            "attempt": att,
            "answers": answers,
            "questions": questions,
        }
