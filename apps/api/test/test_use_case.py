from app.application.use_cases.lessons.lesson_use_case import ListLessonsUseCase
from app.infrastructure.repositories.lessons import MockRepository
import pytest

mock_list_lesson_use_case =  ListLessonsUseCase(
    MockRepository()
)



@pytest.mark.asyncio
async def test_list_lessons():
    result = await mock_list_lesson_use_case.execute()
    assert len(result) == 1
    assert result[0].name == "Topic 1"
    assert result[0].description == "Topic 1 description"
    assert result[0].order == 1
