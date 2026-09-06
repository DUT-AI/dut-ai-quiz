from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import FocusEventEntity
from app.domain.events.attempts import AttemptViolationEvent
from app.domain.events.bus import EventBus
from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IFocusEventRepository,
    IQuestionRepository,
)
from app.domain.value_objects import AttemptStatus
from app.presentation.schemas.attempts import AttemptAnswersPatch
from app.presentation.schemas.common import FocusEventIn


class GetAttemptUseCase:
    def __init__(self, att_repo: IAttemptRepository, question_repo: IQuestionRepository):
        self._att_repo = att_repo
        self._question_repo = question_repo

    async def execute(self, attempt_id: UUID, user_id: int) -> dict | None:
        att = await self._att_repo.get(attempt_id)
        if not att or att.user_id != user_id:
            return None

        if not att.shuffle_snapshot:
            return {"attempt": att, "questions": [], "saved_answers": []}

        ids = [UUID(x) for x in att.shuffle_snapshot.question_order]
        if not ids:
            return {"attempt": att, "questions": [], "saved_answers": []}

        ordered = []
        for i in ids:
            q = await self._question_repo.get(i)
            if q:
                ordered.append(q)

        questions = att.shuffle_snapshot.reconstruct_presentation(
            {q.id: q for q in ordered}
        )

        # Load saved answers so frontend can restore progress on reconnect
        saved_answers = await self._att_repo.list_answers(attempt_id)

        return {"attempt": att, "questions": questions, "saved_answers": saved_answers}


class GetAttemptDetailUseCase:
    def __init__(
        self,
        att_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
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
    def __init__(self, att_repo: IAttemptRepository):
        self._att_repo = att_repo

    async def execute(self, exam_id: UUID):
        return await self._att_repo.list_for_exam(exam_id)


class PatchAttemptAnswersUseCase:
    def __init__(self, att_repo: IAttemptRepository):
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
        att_repo: IAttemptRepository,
        fe_repo: IFocusEventRepository,
        event_bus: EventBus,
    ):
        self._att_repo = att_repo
        self._fe_repo = fe_repo
        self._event_bus = event_bus

    async def execute(
        self,
        attempt_id: UUID,
        user_id: int,
        body: FocusEventIn,
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
    def __init__(self, att_repo: IAttemptRepository):
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

