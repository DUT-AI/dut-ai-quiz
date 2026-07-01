from uuid import uuid4

from app.core.datetime_utils import utc_to_ict
from app.domain.entities.exam import ExamEntity
from app.domain.interfaces import IExamRepository
from app.presentation.schemas.exams import ExamCreate


class CreateExamUseCase:
    def __init__(self, exam_repo: IExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, payload: ExamCreate, teacher_user_id: int) -> ExamEntity:
        entity = ExamEntity(
            id=uuid4(),
            title=payload.title,
            description=payload.description,
            start_time=utc_to_ict(payload.start_time).replace(tzinfo=None)
            if payload.start_time
            else None,
            end_time=utc_to_ict(payload.end_time).replace(tzinfo=None)
            if payload.end_time
            else None,
            duration_minutes=payload.duration_minutes,
            max_attempts=payload.max_attempts,
            is_published=payload.is_published,
            created_by=teacher_user_id,
            participant_ids=payload.participant_ids,
        )
        return await self._exam_repo.add(entity)
