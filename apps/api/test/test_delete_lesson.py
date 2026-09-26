from uuid import uuid4

import pytest
from app.application.use_cases.lessons.delete_lesson_uc import DeleteLessonUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository


class MockLessonRepository(ILessonRepository):
    def __init__(self):
        self.db: dict = {}

    async def list_all(self) -> list[LessonEntity]:
        return list(self.db.values())

    async def get(self, lesson_id) -> LessonEntity | None:
        return self.db.get(lesson_id)

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        for item in self.db.values():
            if item.slug == slug:
                return item
        return None

    async def add(self, entity: LessonEntity) -> LessonEntity:
        self.db[entity.id] = entity
        return entity

    async def update(self, entity: LessonEntity) -> LessonEntity:
        self.db[entity.id] = entity
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        self.db.pop(entity.id, None)


@pytest.mark.asyncio
async def test_delete_existing_lesson_success():
    repo = MockLessonRepository()
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Lesson 1",
        description="",
        content_md="",
        order=1,
        slug="lesson-1",
        created_at=now_ict(),
    )
    await repo.add(lesson)

    use_case = DeleteLessonUseCase(repo)
    result = await use_case.execute(str(lesson_id))

    assert result is True
    assert await repo.get(lesson_id) is None


@pytest.mark.asyncio
async def test_delete_non_existing_lesson_returns_false():
    repo = MockLessonRepository()
    use_case = DeleteLessonUseCase(repo)
    result = await use_case.execute(str(uuid4()))

    assert result is False


