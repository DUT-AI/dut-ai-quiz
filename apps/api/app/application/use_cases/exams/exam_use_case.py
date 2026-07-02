from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.exam import ExamEntity
from app.domain.interfaces import IExamQuestionRepository, IExamRepository
from app.presentation.schemas.exams import ExamCreate, ExamUpdate
from app.core.datetime_utils import utc_to_ict


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


class GetExamUseCase:
    def __init__(self, exam_repo: IExamRepository):
        self._exam_repo = exam_repo

    async def execute(
        self, exam_id: UUID, user_id: int | None = None, role: str | None = None
    ) -> ExamEntity | None:
        entity = await self._exam_repo.get(exam_id)
        if not entity:
            return None

        # If student/teacher is checking for participation, verify participation or ownership
        if user_id is not None:
            if user_id != entity.created_by and user_id not in entity.participant_ids:
                return None
        return entity


class ListExamsUseCase:
    def __init__(self, exam_repo: IExamRepository):
        self._exam_repo = exam_repo

    async def execute_for_teacher(self, user_id: int) -> list[ExamEntity]:
        return await self._exam_repo.list_for_teacher(user_id)

    async def execute_for_student(
        self, user_id: int, now: datetime
    ) -> list[ExamEntity]:
        return await self._exam_repo.list_published_for_student(user_id, now)


class UpdateExamUseCase:
    def __init__(self, exam_repo: IExamRepository):
        self._exam_repo = exam_repo

    async def execute(
        self, exam_id: UUID, payload: ExamUpdate, teacher_user_id: int
    ) -> ExamEntity | None:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return None

        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            if k in ["start_time", "end_time"] and v is not None:
                v = utc_to_ict(v).replace(tzinfo=None)
            setattr(entity, k, v)

        return await self._exam_repo.update(entity)


class DeleteExamUseCase:
    def __init__(self, exam_repo: IExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, exam_id: UUID, teacher_user_id: int) -> bool:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return False

        await self._exam_repo.delete(entity)
        return True


class ListExamQuestionsUseCase:
    def __init__(
        self, exam_repo: IExamRepository, exam_question_repo: IExamQuestionRepository
    ):
        self._exam_repo = exam_repo
        self._exam_question_repo = exam_question_repo

    async def execute(self, exam_id: UUID, teacher_user_id: int):
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return None

        return await self._exam_question_repo.load_questions_ordered(exam_id)


class SetExamQuestionsUseCase:
    def __init__(
        self, exam_repo: IExamRepository, exam_question_repo: IExamQuestionRepository
    ):
        self._exam_repo = exam_repo
        self._exam_question_repo = exam_question_repo

    async def execute(
        self, exam_id: UUID, question_ids: list[UUID], teacher_user_id: int
    ) -> bool:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return False

        await self._exam_question_repo.replace_all(exam_id, question_ids)
        return True
