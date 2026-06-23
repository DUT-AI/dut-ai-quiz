from uuid import UUID

from app.domain.entities.question import QuestionEntity


def score_attempt(
    questions: list[QuestionEntity], answers_by_question_id: dict[UUID, str | None]
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
