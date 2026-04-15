import secrets
from datetime import datetime, timedelta
from uuid import UUID

from app.application.services.shuffle import build_shuffled_exam_payload
from app.infrastructure.persistence.models import Attempt, AttemptStatus
from app.infrastructure.repositories.attempts import AttemptRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.infrastructure.repositories.exams import ExamRepository


async def execute(session, exam_id: UUID, user_id: int):
    exam_repo = ExamRepository(session)
    eq_repo = ExamQuestionRepository(session)
    att_repo = AttemptRepository(session)

    exam = await exam_repo.get(exam_id)
    if not exam or not exam.is_published:
        return None, "not_found"
    now = datetime.utcnow()
    if exam.start_time and exam.start_time > now:
        return None, "not_started"
    if exam.end_time and exam.end_time < now:
        return None, "ended"

    tries = await att_repo.count_for_user_exam(user_id, exam_id)
    if tries >= exam.max_attempts:
        return None, "max_attempts"

    questions = await eq_repo.load_questions_ordered(exam_id)
    if not questions:
        return None, "no_questions"

    seed = secrets.randbelow(2**31)
    presentation, snapshot = build_shuffled_exam_payload(questions, seed)
    expires_at = now + timedelta(minutes=exam.duration_minutes)

    att = Attempt(
        exam_id=exam_id,
        user_id=user_id,
        expires_at=expires_at,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=seed,
        shuffle_snapshot=snapshot,
    )
    att = await att_repo.add(att)
    return {"attempt": att, "presentation": presentation}, "ok"
