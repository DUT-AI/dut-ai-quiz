import secrets
from datetime import timedelta
from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import AttemptEntity
from app.domain.exceptions.exceptions import (
    ExamNoQuestionsException,
    ExamNotFoundException,
    MaxAttemptsReachedException,
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

    async def execute(self, exam_id: UUID, user_id: int, action: str = "start") -> dict:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise ExamNotFoundException()

        exam.check_can_start(user_id)

        now = now_ict()
        completed_count = await self._att_repo.count_completed_for_user_exam(
            user_id, exam_id
        )

        active_att = await self._att_repo.get_active_for_user_exam(user_id, exam_id)
        if active_att:
            # If expired (+ 60s grace), mark abandoned
            if now > active_att.expires_at + timedelta(seconds=60):
                active_att.status = AttemptStatus.ABANDONED
                active_att.completed_at = now
                await self._att_repo.save(active_att)
            elif action == "restart":
                if (completed_count + 1) >= exam.max_attempts:
                    raise MaxAttemptsReachedException()
                active_att.status = AttemptStatus.ABANDONED
                active_att.completed_at = now
                await self._att_repo.save(active_att)
            else:
                # Resume active attempt
                questions = await self._eq_repo.load_questions_ordered(exam_id)
                q_map = {q.id: q for q in questions}
                if active_att.shuffle_snapshot:
                    presentation = active_att.shuffle_snapshot.reconstruct_presentation(
                        q_map
                    )
                else:
                    res = exam.build_shuffled_exam_payload(
                        questions, active_att.shuffle_seed or 0
                    )
                    presentation = res.presentation
                saved_answers = await self._att_repo.list_answers(active_att.id)
                return {
                    "attempt": active_att,
                    "presentation": presentation,
                    "is_resumed": True,
                    "saved_answers": saved_answers,
                }

        # Check max attempts limit for creating new attempt
        if completed_count >= exam.max_attempts:
            raise MaxAttemptsReachedException()

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
        return {
            "attempt": att,
            "presentation": shuffled_result.presentation,
            "is_resumed": False,
        }
