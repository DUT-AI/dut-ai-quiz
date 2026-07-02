from app.domain.exceptions.exceptions import ReviewLockedException
from app.domain.exceptions.exceptions import AttemptNotCompletedException
from app.domain.exceptions.exceptions import AttemptNotFoundException
from uuid import UUID


from app.domain.value_objects import AttemptStatus
from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
)


class ReviewAttemptUseCase:
    def __init__(
        self,
        att_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
        exam_repo: IExamRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo
        self._exam_repo = exam_repo

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
        questions = await self._eq_repo.load_questions_ordered(att.exam_id)

        return {
            "attempt": att,
            "answers": answers,
            "questions": questions,
        }
