from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.exam import ExamEntity
from app.infrastructure.repositories.exams import ExamRepository
from app.infrastructure.repositories.exam_questions import ExamQuestionRepository
from app.presentation.schemas.exams import ExamCreate, ExamUpdate


class CreateExamUseCase:
    def __init__(self, exam_repo: ExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, payload: ExamCreate, teacher_user_id: int) -> ExamEntity:
        entity = ExamEntity(
            id=uuid4(),
            title=payload.title,
            description=payload.description,
            start_time=payload.start_time,
            end_time=payload.end_time,
            duration_minutes=payload.duration_minutes,
            max_attempts=payload.max_attempts,
            is_published=payload.is_published,
            created_by=teacher_user_id,
        )
        return await self._exam_repo.add(entity)


class GetExamUseCase:
    def __init__(self, exam_repo: ExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, exam_id: UUID) -> ExamEntity | None:
        return await self._exam_repo.get(exam_id)


class ListExamsUseCase:
    def __init__(self, exam_repo: ExamRepository):
        self._exam_repo = exam_repo

    async def execute_for_teacher(self, user_id: int) -> list[ExamEntity]:
        return await self._exam_repo.list_for_teacher(user_id)

    async def execute_for_student(self, now: datetime) -> list[ExamEntity]:
        return await self._exam_repo.list_published_for_student(now)


class UpdateExamUseCase:
    def __init__(self, exam_repo: ExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, exam_id: UUID, payload: ExamUpdate, teacher_user_id: int) -> ExamEntity | None:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return None
        
        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            setattr(entity, k, v)
            
        return await self._exam_repo.update(entity)


class DeleteExamUseCase:
    def __init__(self, exam_repo: ExamRepository):
        self._exam_repo = exam_repo

    async def execute(self, exam_id: UUID, teacher_user_id: int) -> bool:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return False
        
        await self._exam_repo.delete(entity)
        return True


class ListExamQuestionsUseCase:
    def __init__(
        self,
        exam_repo: ExamRepository,
        exam_question_repo: ExamQuestionRepository
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
        self,
        exam_repo: ExamRepository,
        exam_question_repo: ExamQuestionRepository
    ):
        self._exam_repo = exam_repo
        self._exam_question_repo = exam_question_repo

    async def execute(self, exam_id: UUID, question_ids: list[UUID], teacher_user_id: int) -> bool:
        entity = await self._exam_repo.get(exam_id)
        if not entity or entity.created_by != teacher_user_id:
            return False
        
        await self._exam_question_repo.replace_all(exam_id, question_ids)
        return True
