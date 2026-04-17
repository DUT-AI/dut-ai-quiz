from uuid import uuid4, UUID
from app.infrastructure.repositories.lessons import LessonRepository
from app.infrastructure.repositories.questions import QuestionRepository
from app.infrastructure.persistence.models import PoolType
from app.domain.entities.lesson import LessonEntity
from app.core.datetime_utils import now_ict
from app.presentation.schemas.lessons import LessonCreate, LessonUpdate


class ListLessonsUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[LessonEntity]:
        return await self._repo.list_all()


class GetLessonDetailUseCase:
    def __init__(self, lesson_repo: LessonRepository, question_repo: QuestionRepository) -> None:
        self._lesson_repo = lesson_repo
        self._question_repo = question_repo

    async def execute(self, lesson_id: str, is_teacher: bool = False) -> dict | None:
        lid = UUID(lesson_id)
        lesson = await self._lesson_repo.get(lid)
        if not lesson:
            return None
            
        # Only show PRACTICE questions for students
        pool_type = None if is_teacher else PoolType.PRACTICE
        questions = await self._question_repo.list_all(lesson_id=lid, pool_type=pool_type)
        
        return {
            "id": lesson.id,
            "name": lesson.name,
            "description": lesson.description,
            "order": lesson.order,
            "created_at": lesson.created_at,
            "questions": questions
        }


class CreateLessonUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self, payload: LessonCreate) -> LessonEntity:
        now = now_ict()
        entity = LessonEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            order=payload.order,
            created_at=now,
        )
        return await self._repo.add(entity)


class UpdateLessonUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(
        self, lesson_id: str, payload: LessonUpdate
    ) -> LessonEntity | None:
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return None

        if payload.name is not None:
            entity.name = payload.name
        if payload.description is not None:
            entity.description = payload.description
        if payload.order is not None:
            entity.order = payload.order

        return await self._repo.update(entity)


class DeleteLessonUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self, lesson_id: str) -> bool:
        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return False
        await self._repo.delete(entity)
        return True
