import secrets
from datetime import timedelta
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import AttemptEntity
from app.domain.exceptions.exceptions import (
    ExamNoQuestionsException,
    ExamNotFoundException,
)
from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
)
from app.domain.value_objects import AttemptStatus


class StartAttemptUseCase:
    def __init__(
        self,
        exam_repo: IExamRepository,
        eq_repo: IExamQuestionRepository,
        att_repo: IAttemptRepository,
    ):
        self._exam_repo = exam_repo
        self._eq_repo = eq_repo
        self._att_repo = att_repo

    async def execute(self, exam_id: UUID, user_id: int) -> dict:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise ExamNotFoundException()

        exam.check_can_start()

        now = now_ict()
        questions = await self._eq_repo.load_questions_ordered(exam_id)
        if not questions:
            raise ExamNoQuestionsException()

        seed = secrets.randbelow(2**31)
        shuffled_result = exam.build_shuffled_exam_payload(questions, seed)
        expires_at = now + timedelta(minutes=exam.duration_minutes)

        att_entity = AttemptEntity(
            id=uuid4(),
            exam_id=exam_id,
            user_id=user_id,
            started_at=now,
            completed_at=None,
            expires_at=expires_at,
            score=None,
            status=AttemptStatus.IN_PROGRESS,
            tab_out_count=0,
            shuffle_seed=seed,
            shuffle_snapshot=shuffled_result.snapshot,
        )
        att = await self._att_repo.add(att_entity)
        return {"attempt": att, "presentation": shuffled_result.presentation}
