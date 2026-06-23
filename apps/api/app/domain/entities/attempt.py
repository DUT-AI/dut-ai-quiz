from app.domain.entities.question import QuestionEntity
import dataclasses
from datetime import datetime
from uuid import UUID
from app.infrastructure.persistence.models import AttemptStatus
from app.domain.value_objects import ShuffledSnapshot


@dataclasses.dataclass
class AttemptEntity:
    id: UUID
    exam_id: UUID
    user_id: int
    started_at: datetime
    completed_at: datetime | None
    expires_at: datetime
    score: float | None
    status: AttemptStatus
    tab_out_count: int
    shuffle_seed: int | None
    shuffle_snapshot: ShuffledSnapshot | None

    def score_attempt(
        self,
        questions: list[QuestionEntity],
        answers_by_question_id: dict[UUID, str | None],
    ) -> float:
        n = len(questions)
        if n == 0:
            return 0.0
        per = 10.0 / n
        correct = 0
        for q in questions:
            sel = answers_by_question_id.get(q.id)
            if sel is None:
                continue
            for opt in q.options:
                if opt.id == sel and opt.is_correct:
                    correct += 1
                    break
        total = correct * per
        return round(min(total, 10.0), 2)


@dataclasses.dataclass
class AttemptAnswerEntity:
    id: UUID
    attempt_id: UUID
    question_id: UUID
    selected_option_id: str | None


@dataclasses.dataclass
class FocusEventEntity:
    id: UUID
    attempt_id: UUID
    client_event_id: str
    event: str
    received_at: datetime
