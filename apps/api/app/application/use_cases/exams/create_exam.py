from app.infrastructure.persistence.models import Exam
from app.infrastructure.repositories.exams import ExamRepository
from app.presentation.schemas.exams import ExamCreate


async def execute(payload: ExamCreate, session, teacher_user_id: int) -> Exam:
    repo = ExamRepository(session)
    ex = Exam(
        title=payload.title,
        description=payload.description,
        start_time=payload.start_time,
        end_time=payload.end_time,
        duration_minutes=payload.duration_minutes,
        max_attempts=payload.max_attempts,
        is_published=payload.is_published,
        created_by=teacher_user_id,
    )
    return await repo.add(ex)
