from uuid import UUID, uuid4

import pytest
from app.application.use_cases.lessons.delete_lesson_uc import DeleteLessonUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.lesson import LessonEntity
from app.domain.entities.question import DuplicateStatus, QuestionEntity, QuestionStatus
from app.domain.interfaces import ILessonRepository, IQuestionRepository
from app.domain.value_objects import Difficulty, PoolType
from app.presentation.schemas.lessons import LessonDeleteAction


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

    async def get_by_identifier(self, identifier: str) -> LessonEntity | None:
        for item in self.db.values():
            if (
                str(item.id) == identifier
                or item.slug == identifier
                or item.name == identifier
            ):
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


class MockQuestionRepository(IQuestionRepository):
    def __init__(self):
        self.questions: dict[UUID, QuestionEntity] = {}
        self.exam_question_ids: set[UUID] = set()

    async def get(self, question_id: UUID) -> QuestionEntity | None:
        return self.questions.get(question_id)

    async def list_all(
        self, *, lesson_id: UUID | None = None, **kwargs
    ) -> list[QuestionEntity]:
        res = list(self.questions.values())
        if lesson_id is not None:
            res = [q for q in res if q.lesson_id == lesson_id]
        return res

    async def add(self, entity: QuestionEntity) -> QuestionEntity:
        self.questions[entity.id] = entity
        return entity

    async def add_bulk(self, entities: list[QuestionEntity]) -> list[QuestionEntity]:
        for e in entities:
            self.questions[e.id] = e
        return entities

    async def update(self, entity: QuestionEntity) -> QuestionEntity:
        self.questions[entity.id] = entity
        return entity

    async def delete(self, entity: QuestionEntity) -> None:
        self.questions.pop(entity.id, None)

    async def delete_bulk(self, question_ids: list[UUID]) -> int:
        count = 0
        for qid in question_ids:
            if qid in self.questions:
                del self.questions[qid]
                count += 1
        return count

    async def search_similar(self, **kwargs):
        return []

    async def count_by_lesson_and_pool(self, lesson_id: UUID, pool_type=None) -> int:
        return len([q for q in self.questions.values() if q.lesson_id == lesson_id])

    async def reassign_lesson(
        self, source_lesson_id: UUID, target_lesson_id: UUID | None
    ) -> int:
        count = 0
        for q in self.questions.values():
            if q.lesson_id == source_lesson_id:
                q.lesson_id = target_lesson_id
                count += 1
        return count

    async def check_questions_in_exams(self, question_ids: list[UUID]) -> bool:
        return any(qid in self.exam_question_ids for qid in question_ids)


def make_dummy_question(lesson_id: UUID) -> QuestionEntity:
    return QuestionEntity(
        id=uuid4(),
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="Test question",
        options=[],
        solution="",
        tags=[],
        lesson_id=lesson_id,
        created_by=1,
        created_at=now_ict(),
        status=QuestionStatus.PUBLIC,
        duplicate_status=DuplicateStatus.NONE,
    )


@pytest.mark.asyncio
async def test_delete_existing_lesson_unassign_questions():
    lesson_repo = MockLessonRepository()
    question_repo = MockQuestionRepository()
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
    await lesson_repo.add(lesson)

    q = make_dummy_question(lesson_id)
    await question_repo.add(q)

    use_case = DeleteLessonUseCase(lesson_repo, question_repo)
    result = await use_case.execute(str(lesson_id), action=LessonDeleteAction.UNASSIGN)

    assert result is True
    assert await lesson_repo.get(lesson_id) is None
    # Question should still exist, with lesson_id unassigned
    updated_q = await question_repo.get(q.id)
    assert updated_q is not None
    assert updated_q.lesson_id is None


@pytest.mark.asyncio
async def test_delete_lesson_reassign_questions():
    lesson_repo = MockLessonRepository()
    question_repo = MockQuestionRepository()
    lesson_1 = LessonEntity(
        id=uuid4(),
        name="Lesson 1",
        description="",
        content_md="",
        order=1,
        slug="lesson-1",
        created_at=now_ict(),
    )
    lesson_2 = LessonEntity(
        id=uuid4(),
        name="Lesson 2",
        description="",
        content_md="",
        order=2,
        slug="lesson-2",
        created_at=now_ict(),
    )
    await lesson_repo.add(lesson_1)
    await lesson_repo.add(lesson_2)

    q = make_dummy_question(lesson_1.id)
    await question_repo.add(q)

    use_case = DeleteLessonUseCase(lesson_repo, question_repo)
    result = await use_case.execute(
        str(lesson_1.id),
        action=LessonDeleteAction.REASSIGN,
        reassign_to_lesson_id=str(lesson_2.id),
    )

    assert result is True
    assert await lesson_repo.get(lesson_1.id) is None
    # Question should be moved to lesson_2
    updated_q = await question_repo.get(q.id)
    assert updated_q is not None
    assert updated_q.lesson_id == lesson_2.id


@pytest.mark.asyncio
async def test_delete_lesson_delete_questions_blocked_by_exams():
    lesson_repo = MockLessonRepository()
    question_repo = MockQuestionRepository()
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
    await lesson_repo.add(lesson)

    q = make_dummy_question(lesson_id)
    await question_repo.add(q)
    # Mark question as referenced in an exam
    question_repo.exam_question_ids.add(q.id)

    use_case = DeleteLessonUseCase(lesson_repo, question_repo)
    with pytest.raises(ValueError, match="đã được sử dụng trong đề thi"):
        await use_case.execute(str(lesson_id), action=LessonDeleteAction.DELETE)

    # Lesson should not have been deleted
    assert await lesson_repo.get(lesson_id) is not None


@pytest.mark.asyncio
async def test_delete_non_existing_lesson_returns_false():
    lesson_repo = MockLessonRepository()
    question_repo = MockQuestionRepository()
    use_case = DeleteLessonUseCase(lesson_repo, question_repo)
    result = await use_case.execute(str(uuid4()))

    assert result is False
