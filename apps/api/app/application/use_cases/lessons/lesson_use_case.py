from uuid import uuid4
from app.infrastructure.repositories.lessons import LessonRepository
from app.domain.entities.lesson import LessonEntity
from app.core.datetime_utils import now_ict
from app.presentation.schemas.lessons import LessonCreate, LessonUpdate


class ListLessonsUseCase:
    def __init__(self, repo: LessonRepository) -> None:
        self._repo = repo

    async def execute(self) -> list[LessonEntity]:
        return await self._repo.list_all()


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
        from uuid import UUID

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
        from uuid import UUID

        entity = await self._repo.get(UUID(lesson_id))
        if not entity:
            return False
        await self._repo.delete(entity)
        return True
