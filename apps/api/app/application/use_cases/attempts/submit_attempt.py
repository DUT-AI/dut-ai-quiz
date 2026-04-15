from datetime import datetime
from uuid import UUID

from app.application.services.scoring import score_attempt
from app.infrastructure.persistence.models import AttemptStatus
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository


async def execute(session, attempt_id: UUID, user_id: int):
    att_repo = AttemptRepository(session)
    eq_repo = ExamQuestionRepository(session)
    att = await att_repo.get(attempt_id)
    if not att or att.user_id != user_id:
        return None, "not_found"
    if att.status == AttemptStatus.COMPLETED:
        return att, "already_done"
    now = datetime.utcnow()
    if att.status != AttemptStatus.IN_PROGRESS:
        return None, "bad_state"
    questions = await eq_repo.load_questions_ordered(att.exam_id)
    answers_rows = await att_repo.list_answers(attempt_id)
    by_q = {a.question_id: a.selected_option_id for a in answers_rows}
    sc = score_attempt(questions, by_q)
    att.score = sc
    att.status = AttemptStatus.COMPLETED
    att.completed_at = now
    await att_repo.save(att)
    return att, "ok"
