from datetime import UTC, datetime
from typing import Any
from uuid import UUID, uuid4

import pytest
from app.application.use_cases.lessons import (
    GetLessonExercisesUseCase,
    GetLessonMetadataUseCase,
)
from app.domain.entities.homework import HomeworkEntity, HomeworkSubmissionEntity
from app.domain.entities.lesson import LessonEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.exceptions.exceptions import NotFoundException
from app.domain.interfaces import (
    IHomeworkRepository,
    ILessonRepository,
    IQuestionRepository,
)
from app.domain.value_objects import Difficulty, PoolType


class MockLessonRepository(ILessonRepository):
    def __init__(self, lessons: list[LessonEntity]) -> None:
        self.lessons = lessons

    async def get(self, lesson_id: UUID) -> LessonEntity | None:
        for item in self.lessons:
            if item.id == lesson_id:
                return item
        return None

    async def get_by_slug(self, slug: str) -> LessonEntity | None:
        for item in self.lessons:
            if item.slug == slug:
                return item
        return None

    async def get_by_identifier(self, identifier: str) -> LessonEntity | None:
        raw = identifier.strip()
        clean_name = raw.replace("-", " ").replace("_", " ")
        for item in self.lessons:
            name_slug = item.name.lower().replace(" ", "-").replace("_", "-")
            if (
                str(item.id) == raw
                or (item.slug and item.slug.lower() == raw.lower())
                or item.name.lower() == raw.lower()
                or item.name.lower() == clean_name.lower()
                or name_slug == raw.lower()
            ):
                return item
        return None

    async def list_all(self) -> list[LessonEntity]:
        return self.lessons

    async def add(self, entity: LessonEntity) -> LessonEntity:
        self.lessons.append(entity)
        return entity

    async def update(self, entity: LessonEntity) -> LessonEntity:
        return entity

    async def delete(self, entity: LessonEntity) -> None:
        self.lessons = [item for item in self.lessons if item.id != entity.id]


class MockHomeworkRepository(IHomeworkRepository):
    def __init__(self, homeworks: list[HomeworkEntity]) -> None:
        self.homeworks = homeworks

    async def list_homeworks(self, lesson_id: UUID | None = None) -> list[HomeworkEntity]:
        if lesson_id is None:
            return self.homeworks
        return [hw for hw in self.homeworks if hw.lesson_id == lesson_id]

    async def lesson_exists(self, lesson_id: UUID) -> bool:
        return True

    async def get_homework(self, homework_id: UUID) -> HomeworkEntity | None:
        for hw in self.homeworks:
            if hw.id == homework_id:
                return hw
        return None

    async def create_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        self.homeworks.append(homework)
        return homework

    async def update_homework(self, homework: HomeworkEntity) -> HomeworkEntity:
        return homework

    async def archive_homework(self, homework_id: UUID) -> bool:
        return True

    async def create_submission(self, submission: HomeworkSubmissionEntity) -> HomeworkSubmissionEntity:
        return submission

    async def get_submission(self, submission_id: UUID) -> HomeworkSubmissionEntity | None:
        return None

    async def get_latest_submission(self, homework_id: UUID, user_id: int) -> HomeworkSubmissionEntity | None:
        return None

    async def retry_failed_submission(self, submission_id: UUID, allow_any_non_grading: bool = False) -> HomeworkSubmissionEntity | None:
        return None

    async def list_submissions(self, homework_id: UUID) -> list[HomeworkSubmissionEntity]:
        return []

    async def list_completed_user_ids(self, homework_id: UUID) -> list[int]:
        return []

    async def list_completed_members_by_lesson(self, lesson_id: UUID) -> list[Any]:
        return []

    async def count_submitters(self, homework_id: UUID) -> int:
        return 0

    async def count_active_by_lesson(self, lesson_id: UUID) -> int:
        return len([hw for hw in self.homeworks if hw.lesson_id == lesson_id])

    async def list_submissions_for_sync_by_lesson(self, lesson_id: UUID) -> list[Any]:
        return []


class MockQuestionRepository(IQuestionRepository):
    def __init__(self, questions: list[QuestionEntity]) -> None:
        self.questions = questions

    async def get(self, question_id):
        return None

    async def list_all(self, offset=0, limit=50, pool_type=None, difficulty=None, tag=None, lesson_id=None, tag_ids=None):
        res = self.questions
        if lesson_id:
            res = [q for q in res if q.lesson_id == lesson_id]
        if pool_type:
            res = [q for q in res if q.pool_type == pool_type]
        return res

    async def count_by_lesson_and_pool(self, lesson_id, pool_type) -> int:
        return len([q for q in self.questions if q.lesson_id == lesson_id and q.pool_type == pool_type])

    async def add(self, entity):
        return entity

    async def update(self, entity):
        return entity

    async def delete(self, entity):
        pass

    async def bulk_add(self, entities):
        return entities


@pytest.mark.asyncio
async def test_get_lesson_metadata_success():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Python Basics",
        description="Introduction to Python",
        content_md="# Content",
        order=1,
        slug="python-basics",
        created_at=datetime.now(UTC),
    )
    hw = HomeworkEntity(
        id=uuid4(),
        lesson_id=lesson_id,
        title="HW 1",
        description="Write code",
        created_by=1,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        attachment_key="key/file.zip",
    )
    q = QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.GAME,
        difficulty=Difficulty.EASY,
        content="What is Python?",
        options=[
            QuestionOptionEntity(id="1", text="Language", is_correct=True),
            QuestionOptionEntity(id="2", text="Snake", is_correct=False),
        ],
        solution="Python is a language",
        lesson_id=lesson_id,
        tags=["python"],
        created_by=1,
        created_at=datetime.now(UTC),
    )

    lesson_repo = MockLessonRepository([lesson])
    homework_repo = MockHomeworkRepository([hw])
    question_repo = MockQuestionRepository([q])

    use_case = GetLessonMetadataUseCase(lesson_repo, homework_repo, question_repo)
    result = await use_case.execute("python-basics")

    assert result.slug == "python-basics"
    assert result.name == "Python Basics"
    assert result.has_coding is True
    assert result.has_game is True
    assert result.coding_count == 1
    assert result.game_question_count == 1
    assert result.is_ready is True


@pytest.mark.asyncio
async def test_get_lesson_metadata_fallback_lookup():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Python Advanced Concepts",
        description="Advanced",
        content_md="# Content",
        order=2,
        slug=None,
        created_at=datetime.now(UTC),
    )

    lesson_repo = MockLessonRepository([lesson])
    homework_repo = MockHomeworkRepository([])
    question_repo = MockQuestionRepository([])

    use_case = GetLessonMetadataUseCase(lesson_repo, homework_repo, question_repo)
    result = await use_case.execute("python-advanced-concepts")

    assert result.slug == str(lesson_id)
    assert result.name == "Python Advanced Concepts"
    assert result.has_coding is False
    assert result.has_game is False
    assert result.is_ready is False


@pytest.mark.asyncio
async def test_get_lesson_metadata_not_found():
    lesson_repo = MockLessonRepository([])
    homework_repo = MockHomeworkRepository([])
    question_repo = MockQuestionRepository([])

    use_case = GetLessonMetadataUseCase(lesson_repo, homework_repo, question_repo)
    with pytest.raises(NotFoundException):
        await use_case.execute("non-existent")


@pytest.mark.asyncio
async def test_get_lesson_exercises_success():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Data Structures",
        description="Stacks and Queues",
        content_md="# DS",
        order=2,
        slug="data-structures",
        created_at=datetime.now(UTC),
    )
    hw = HomeworkEntity(
        id=uuid4(),
        lesson_id=lesson_id,
        title="Stack implementation",
        description="Implement stack using list",
        created_by=1,
        created_at=datetime.now(UTC),
        updated_at=datetime.now(UTC),
        attachment_key="uploads/hw.pdf",
    )

    lesson_repo = MockLessonRepository([lesson])
    homework_repo = MockHomeworkRepository([hw])

    use_case = GetLessonExercisesUseCase(lesson_repo, homework_repo)
    result = await use_case.execute("data-structures")

    assert result.lesson_slug == "data-structures"
    assert result.lesson_name == "Data Structures"
    assert result.total_exercises == 1
    assert len(result.exercises) == 1
    assert result.exercises[0].title == "Stack implementation"
    assert result.exercises[0].has_attachment is True


@pytest.mark.asyncio
async def test_get_lesson_exercises_not_found():
    lesson_repo = MockLessonRepository([])
    homework_repo = MockHomeworkRepository([])

    use_case = GetLessonExercisesUseCase(lesson_repo, homework_repo)
    with pytest.raises(NotFoundException):
        await use_case.execute("non-existent")


@pytest.mark.asyncio
async def test_get_by_identifier_resolution():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Algorithmic Thinking",
        description="Algorithms",
        content_md="# Algo",
        order=3,
        slug="algorithmic-thinking",
        created_at=datetime.now(UTC),
    )
    repo = MockLessonRepository([lesson])

    # 1. By UUID
    res_uuid = await repo.get_by_identifier(str(lesson_id))
    assert res_uuid is not None
    assert res_uuid.id == lesson_id

    # 2. By slug
    res_slug = await repo.get_by_identifier("algorithmic-thinking")
    assert res_slug is not None
    assert res_slug.id == lesson_id

    # 3. By exact name
    res_name = await repo.get_by_identifier("Algorithmic Thinking")
    assert res_name is not None
    assert res_name.id == lesson_id

    # 4. By case-insensitive name
    res_name_lower = await repo.get_by_identifier("algorithmic thinking")
    assert res_name_lower is not None
    assert res_name_lower.id == lesson_id

    # 5. Non-existent
    res_none = await repo.get_by_identifier("random-unknown")
    assert res_none is None
