from uuid import UUID, uuid4

import pytest
from app.application.use_cases.lessons.list_lessons_uc import ListLessonsUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.interfaces import ILessonRepository


class MockRepository(ILessonRepository):
    async def list_all(self) -> list[LessonEntity]:
        return [
            LessonEntity(
                id=uuid4(),
                name="Topic 1",
                description="Topic 1 description",
                content_md="# Topic 1\n\nTopic 1 content.",
                order=1,
                slug=None,
                created_at=now_ict(),
            )
        ]

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        return None

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        return None

    async def add(self, entity: LessonEntity) -> LessonEntity:
        return entity

    async def update(self, entity: LessonEntity) -> LessonEntity:
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        pass


mock_list_lesson_use_case = ListLessonsUseCase(MockRepository())


@pytest.mark.asyncio
async def test_list_lessons():
    result = await mock_list_lesson_use_case.execute()
    assert len(result) == 1
    assert result[0].name == "Topic 1"
    assert result[0].description == "Topic 1 description"
    assert result[0].order == 1
