from uuid import UUID

from app.infrastructure.persistence.models import Exam
from app.infrastructure.repositories.exams import ExamRepository
from app.presentation.schemas.exams import ExamUpdate


async def execute(session, exam_id: UUID, payload: ExamUpdate, teacher_user_id: int) -> Exam | None:
    repo = ExamRepository(session)
    ex = await repo.get(exam_id)
    if not ex or ex.created_by != teacher_user_id:
        return None
    data = payload.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(ex, k, v)
    await session.flush()
    await session.refresh(ex)
    return ex
