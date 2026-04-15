from uuid import UUID

from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository


async def execute(session, attempt_id: UUID):
    att_repo = AttemptRepository(session)
    att = await att_repo.get(attempt_id)
    if not att:
        return None
    answers = await att_repo.list_answers(attempt_id)
    eq = ExamQuestionRepository(session)
    questions = await eq.load_questions_ordered(att.exam_id)
    return {"attempt": att, "answers": answers, "questions": questions}
