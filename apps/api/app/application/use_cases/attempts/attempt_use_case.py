import secrets
from datetime import datetime, timedelta
from uuid import UUID

from app.core.datetime_utils import now_ict
from app.application.services.shuffle import (
    build_shuffled_exam_payload,
    presentation_from_snapshot,
)
from app.application.services.scoring import score_attempt
from app.domain.entities.attempt import AttemptEntity, FocusEventEntity
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.focus_events import FocusEventRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.persistence.models import AttemptStatus
from app.domain.events.bus import EventBus
from app.domain.events.attempts import AttemptViolationEvent
from app.presentation.schemas.common import FocusEventIn
from app.presentation.schemas.attempts import AttemptAnswersPatch


class StartAttemptUseCase:
    def __init__(
        self,
        exam_repo: ExamRepository,
        eq_repo: ExamQuestionRepository,
        att_repo: AttemptRepository,
    ):
        self._exam_repo = exam_repo
        self._eq_repo = eq_repo
        self._att_repo = att_repo

    async def execute(self, exam_id: UUID, user_id: int):
        exam = await self._exam_repo.get(exam_id)
        if not exam or not exam.is_published:
            return None, "not_found"

        now = now_ict()
        if exam.start_time and exam.start_time > now:
            return None, "not_started"
        if exam.end_time and exam.end_time < now:
            return None, "ended"

        tries = await self._att_repo.count_for_user_exam(user_id, exam_id)
        if tries >= exam.max_attempts:
            return None, "max_attempts"

        questions = await self._eq_repo.load_questions_ordered(exam_id)
        if not questions:
            return None, "no_questions"

        seed = secrets.randbelow(2**31)
        presentation, snapshot = build_shuffled_exam_payload(questions, seed)
        expires_at = now + timedelta(minutes=exam.duration_minutes)

        from uuid import uuid4

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
            shuffle_snapshot=snapshot,
        )
        att = await self._att_repo.add(att_entity)
        return {"attempt": att, "presentation": presentation}, "ok"


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

        sc = score_attempt(questions, by_q)
        att.score = sc
        att.status = AttemptStatus.COMPLETED
        att.completed_at = now
        await self._att_repo.save(att)
        return att, "ok"


class GetAttemptUseCase:
    def __init__(self, att_repo: AttemptRepository, question_repo: QuestionRepository):
        self._att_repo = att_repo
        self._question_repo = question_repo

    async def execute(self, attempt_id: UUID, user_id: int) -> dict | None:
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return None

        if not att.shuffle_snapshot:
            return {"attempt": att, "questions": [], "saved_answers": []}

        ids = [UUID(x) for x in att.shuffle_snapshot.get("question_order", [])]
        if not ids:
            return {"attempt": att, "questions": [], "saved_answers": []}

        ordered = []
        for i in ids:
            q = await self._question_repo.get(i)
            if q:
                ordered.append(q)

        questions = presentation_from_snapshot(
            {q.id: q for q in ordered}, att.shuffle_snapshot
        )

        # Load saved answers so frontend can restore progress on reconnect
        saved_answers = await self._att_repo.list_answers(attempt_id)

        return {"attempt": att, "questions": questions, "saved_answers": saved_answers}


class GetAttemptDetailUseCase:
    def __init__(
        self,
        att_repo: AttemptRepository,
        eq_repo: ExamQuestionRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo

    async def execute(self, attempt_id: UUID):
        att = await self._att_repo.get(attempt_id)
        if not att:
            return None
        answers = await self._att_repo.list_answers(attempt_id)
        questions = await self._eq_repo.load_questions_ordered(att.exam_id)
        return {"attempt": att, "answers": answers, "questions": questions}


class ListExamAttemptsUseCase:
    def __init__(self, att_repo: AttemptRepository):
        self._att_repo = att_repo

    async def execute(self, exam_id: UUID):
        return await self._att_repo.list_for_exam(exam_id)


class PatchAttemptAnswersUseCase:
    def __init__(self, att_repo: AttemptRepository):
        self._att_repo = att_repo

    async def execute(
        self, attempt_id: UUID, user_id: int, payload: AttemptAnswersPatch
    ) -> bool:
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return False

        if att.status != AttemptStatus.IN_PROGRESS:
            return False

        for a in payload.answers:
            await self._att_repo.upsert_answer(
                attempt_id, a.question_id, a.selected_option_id
            )
        return True


class RecordFocusEventUseCase:
    def __init__(
        self,
        att_repo: AttemptRepository,
        fe_repo: FocusEventRepository,
        event_bus: EventBus,
    ):
        self._att_repo = att_repo
        self._fe_repo = fe_repo
        self._event_bus = event_bus

    async def execute(
        self, attempt_id: UUID, user_id: int, body: FocusEventIn, session=None
    ) -> dict | None:
        ERROR_LIMIT = 3
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return None
        if att.status != AttemptStatus.IN_PROGRESS:
            return None
        if now_ict() > att.expires_at:
            return None
        # Events that count toward auto-submit threshold
        violation_events = [
            "visibility_hidden",
            "window_blur",
            "exit_fullscreen",
            "poll_loss_focus",
            "timer_throttled",  # RAF-based detection: extension bypass detected
            "mouse_leave",
            "devtools_detected",  # DevTools opened (window size diff)
        ]
        # Events that are logged but don't increment tab_out_count
        warning_events = []
        allowed_events = violation_events + warning_events
        if body.event not in allowed_events:
            return {"tab_out_count": att.tab_out_count, "action": "IGNORED"}

        exists = await self._fe_repo.exists_for_client_event(body.client_event_id)
        if exists:
            return {"tab_out_count": att.tab_out_count, "action": "IGNORED"}

        from uuid import uuid4

        fe_entity = FocusEventEntity(
            id=uuid4(),
            attempt_id=attempt_id,
            client_event_id=body.client_event_id,
            event=body.event,
            received_at=now_ict(),
        )
        await self._fe_repo.add(fe_entity)

        # Only violation events count toward auto-submit
        if body.event in violation_events:
            att.tab_out_count += 1
            await self._att_repo.save(att)

        if att.tab_out_count >= ERROR_LIMIT:
            await self._event_bus.publish(
                AttemptViolationEvent(
                    attempt_id=attempt_id, user_id=user_id, reason="multiple_tab_outs"
                )
            )
            # Fetch latest state after auto-submission might have happened
            a = await self._att_repo.get(attempt_id)
            return {
                "tab_out_count": att.tab_out_count,
                "action": "AUTO_SUBMITTED",
                "attempt": {
                    "status": a.status.value if a else None,
                    "score": float(a.score) if a and a.score is not None else None,
                    "completed_at": (
                        a.completed_at.isoformat() if a and a.completed_at else None
                    ),
                },
            }

        if body.event in warning_events:
            return {"tab_out_count": att.tab_out_count, "action": "LOGGED"}

        return {"tab_out_count": att.tab_out_count, "action": "WARN"}


class ListUserAttemptsUseCase:
    def __init__(self, att_repo: AttemptRepository):
        self._att_repo = att_repo

    async def execute(self, user_id: int):
        rows = await self._att_repo.list_for_user(user_id)
        # rows is list of (AttemptEntity, exam_title)
        return [
            {
                "attempt": att,
                "exam_title": title,
            }
            for att, title in rows
        ]


class ReviewAttemptUseCase:
    def __init__(
        self,
        att_repo: AttemptRepository,
        eq_repo: ExamQuestionRepository,
        exam_repo: ExamRepository,
    ):
        self._att_repo = att_repo
        self._eq_repo = eq_repo
        self._exam_repo = exam_repo

    async def execute(self, attempt_id: UUID, user_id: int):
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return None

        # Only allow review if COMPLETED
        if att.status != AttemptStatus.COMPLETED:
            return None

        # Block review until exam window fully closes (end_time + duration)
        exam = await self._exam_repo.get(att.exam_id)
        if exam and exam.end_time:
            review_unlock_at = exam.end_time + timedelta(minutes=exam.duration_minutes)
            if now_ict() < review_unlock_at:
                return None, "review_locked"

        answers = await self._att_repo.list_answers(attempt_id)
        questions = await self._eq_repo.load_questions_ordered(att.exam_id)

        return {
            "attempt": att,
            "answers": answers,
            "questions": questions,
        }
