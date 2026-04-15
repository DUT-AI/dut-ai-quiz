from uuid import UUID

from app.infrastructure.persistence.models import Question


def score_attempt(questions: list[Question], answers_by_question_id: dict[UUID, str | None]) -> float:
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
            if opt.get("id") == sel and opt.get("is_correct"):
                correct += 1
                break
    total = correct * per
    return round(min(total, 10.0), 2)
