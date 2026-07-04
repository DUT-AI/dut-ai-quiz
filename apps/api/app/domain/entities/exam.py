import dataclasses
import random
from datetime import datetime
from uuid import UUID

from app.core.datetime_utils import now_ict
from app.domain.entities.question import QuestionEntity
from app.domain.exceptions.exceptions import (
    ExamEndedException,
    ExamNotFoundException,
    ExamNotStartedException,
)
from app.domain.value_objects import (
    ShuffledExamResult,
    ShuffledOption,
    ShuffledQuestion,
    ShuffledSnapshot,
)


@dataclasses.dataclass
class ExamEntity:
    id: UUID
    title: str
    description: str
    start_time: datetime | None
    end_time: datetime | None
    duration_minutes: int
    max_attempts: int
    is_published: bool
    created_by: int
    participant_ids: list[int]
    show_answers: bool = False

    def check_can_start(self):
        if not self.is_published:
            raise ExamNotFoundException()

        now = now_ict()
        if self.start_time and self.start_time > now:
            raise ExamNotStartedException()

        if self.end_time and self.end_time < now:
            raise ExamEndedException()

    def check_review_lock_status(self) -> bool:
        return not self.show_answers

    def build_shuffled_exam_payload(
        self,
        questions_in_order: list[QuestionEntity],
        seed: int,
    ) -> ShuffledExamResult:
        rng = random.Random(seed)
        ordered = list(questions_in_order)
        rng.shuffle(ordered)

        snapshot_options = {}
        presentation = []

        for q in ordered:
            # Map options to ShuffledOption (stripping is_correct)
            opts = [
                ShuffledOption(
                    id=o.id,
                    text=o.text,
                    fixed=o.fixed,
                )
                for o in q.options
            ]
            # Shuffle non-fixed options while preserving positions of fixed options
            non_fixed_opts = [o for o in opts if not o.fixed]
            rng.shuffle(non_fixed_opts)

            non_fixed_iter = iter(non_fixed_opts)
            shuffled_opts = []
            for o in opts:
                if o.fixed:
                    shuffled_opts.append(o)
                else:
                    shuffled_opts.append(next(non_fixed_iter))

            snapshot_options[str(q.id)] = [o.id for o in shuffled_opts]
            presentation.append(
                ShuffledQuestion(
                    question_id=str(q.id),
                    content=q.content,
                    options=shuffled_opts,
                    tags=q.tags,
                )
            )

        snapshot = ShuffledSnapshot(
            question_order=[str(q.id) for q in ordered],
            options=snapshot_options,
        )
        return ShuffledExamResult(presentation=presentation, snapshot=snapshot)
