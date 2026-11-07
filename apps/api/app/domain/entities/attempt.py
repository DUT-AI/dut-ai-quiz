import dataclasses
from datetime import datetime
from uuid import UUID

from app.domain.entities.question import QuestionEntity
from app.domain.value_objects import AttemptStatus, ShuffledSnapshot


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
    correct_count: int | None = None
    total_questions: int | None = None

    def score_attempt(
        self,
        questions: list[QuestionEntity],
        answers_by_question_id: dict[UUID, str | None],
    ) -> float:
        n = len(questions)
        self.total_questions = n
        if n == 0:
            self.correct_count = 0
            self.score = 0.0
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
        self.correct_count = correct
        total = round(min(correct * per, 10.0), 2)
        self.score = total
        return total


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
