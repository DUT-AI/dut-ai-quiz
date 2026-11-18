from datetime import datetime
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from app.application.use_cases.lessons.get_lesson_by_slug_uc import (
    GetLessonBySlugUseCase,
)
from app.application.use_cases.lessons.get_lesson_detail_uc import (
    GetLessonDetailUseCase,
)
from app.application.use_cases.lessons.list_lesson_essay_questions_uc import (
    ListLessonEssayQuestionsUseCase,
)
from app.application.use_cases.lessons.sync_lesson_essay_questions_uc import (
    SyncLessonEssayQuestionsUseCase,
)
from app.domain.entities.lesson import LessonEntity
from app.domain.entities.lesson_essay_question import LessonEssayQuestionEntity
from app.domain.exceptions.exceptions import NotFoundException
from app.infrastructure.persistence.models.lesson_essay_question import (
    LessonEssayQuestion,
)
from app.infrastructure.repositories.lesson_essay_questions import (
    LessonEssayQuestionRepository,
)
from app.presentation.schemas.lessons import (
    LessonDetailOut,
    LessonEssayQuestionCreate,
)
from pydantic import ValidationError


def _make_lesson(lesson_id=None, slug="ham-so") -> LessonEntity:
    return LessonEntity(
        id=lesson_id or uuid4(),
        name="Hàm số",
        description="Kiến thức hàm số",
        order=1,
        slug=slug,
        created_at=datetime.now(),
        content_md="# Lý thuyết",
    )


@pytest.mark.asyncio
async def test_list_lesson_essay_questions_returns_ordered_items():
    lesson = _make_lesson()
    q1 = LessonEssayQuestionEntity(
        id=uuid4(),
        lesson_id=lesson.id,
        question_md="### Câu 1\nPhân biệt **stack** và **queue**?",
        answer_md="- Stack: LIFO\n- Queue: FIFO",
        order=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )
    q2 = LessonEssayQuestionEntity(
        id=uuid4(),
        lesson_id=lesson.id,
        question_md="### Câu 2\nĐộ phức tạp của QuickSort là gì?",
        answer_md="Trung bình $O(n \\log n)$, xấu nhất $O(n^2)$.",
        order=1,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson
    essay_repo = AsyncMock()
    essay_repo.list_by_lesson_id.return_value = [q1, q2]

    use_case = ListLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    result = await use_case.execute(lesson.id)

    assert len(result) == 2
    assert result[0].order == 0
    assert result[1].order == 1
    assert "stack" in result[0].question_md
    essay_repo.list_by_lesson_id.assert_awaited_once_with(lesson.id)


@pytest.mark.asyncio
async def test_list_lesson_essay_questions_returns_empty_list():
    lesson = _make_lesson()
    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson
    essay_repo = AsyncMock()
    essay_repo.list_by_lesson_id.return_value = []

    use_case = ListLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    assert await use_case.execute(lesson.id) == []


@pytest.mark.asyncio
async def test_list_lesson_essay_questions_not_found():
    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = None
    essay_repo = AsyncMock()

    use_case = ListLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    with pytest.raises(NotFoundException):
        await use_case.execute(uuid4())


@pytest.mark.asyncio
async def test_get_lesson_by_slug_and_detail_include_essay_questions():
    lesson = _make_lesson()
    essay = LessonEssayQuestionEntity(
        id=uuid4(),
        lesson_id=lesson.id,
        question_md="Giải thích Big-O?",
        answer_md="Big-O mô tả cận trên tiệm cận.",
        order=0,
        created_at=datetime.now(),
        updated_at=datetime.now(),
    )

    lesson_repo = AsyncMock()
    lesson_repo.get_by_slug.return_value = lesson
    lesson_repo.get.return_value = lesson

    question_repo = AsyncMock()
    question_repo.list_all.return_value = []

    video_repo = AsyncMock()
    video_repo.list_by_lesson_id.return_value = []

    essay_repo = AsyncMock()
    essay_repo.list_by_lesson_id.return_value = [essay]

    slug_uc = GetLessonBySlugUseCase(
        lesson_repo=lesson_repo,
        question_repo=question_repo,
        video_repo=video_repo,
        essay_question_repo=essay_repo,
    )
    slug_res = await slug_uc.execute(lesson.slug or "ham-so")
    assert len(slug_res["essay_questions"]) == 1
    assert slug_res["essay_questions"][0].id == essay.id

    detail_uc = GetLessonDetailUseCase(
        lesson_repo=lesson_repo,
        question_repo=question_repo,
        video_repo=video_repo,
        essay_question_repo=essay_repo,
    )
    detail_res = await detail_uc.execute(str(lesson.id), is_teacher=True)
    assert detail_res is not None
    assert len(detail_res["essay_questions"]) == 1

    # Ensure response validates against LessonDetailOut contract
    validated = LessonDetailOut.model_validate(detail_res)
    assert len(validated.essay_questions) == 1
    assert validated.essay_questions[0].question_md == "Giải thích Big-O?"


@pytest.mark.asyncio
async def test_sync_lesson_essay_questions_creates_updates_and_normalizes_order():
    lesson = _make_lesson()
    existing_id = uuid4()

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson

    essay_repo = AsyncMock()
    essay_repo.replace_lesson_essay_questions.side_effect = lambda lid, items: items

    use_case = SyncLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    payload = [
        LessonEssayQuestionCreate(
            id=existing_id,
            question_md="  Câu hỏi đã sửa  ",
            answer_md="  Đáp án đã sửa  ",
            order=99,
        ),
        LessonEssayQuestionCreate(
            question_md="Câu hỏi mới",
            answer_md="```python\nprint('ok')\n```",
            order=5,
        ),
    ]

    saved = await use_case.execute(lesson.id, payload)

    assert len(saved) == 2
    assert saved[0].id == existing_id
    assert saved[0].question_md == "Câu hỏi đã sửa"
    assert saved[0].answer_md == "Đáp án đã sửa"
    assert saved[0].order == 0
    assert saved[1].id != existing_id
    assert saved[1].order == 1
    essay_repo.replace_lesson_essay_questions.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_lesson_essay_questions_clears_when_empty():
    lesson = _make_lesson()
    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson
    essay_repo = AsyncMock()
    essay_repo.replace_lesson_essay_questions.return_value = []

    use_case = SyncLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    saved = await use_case.execute(lesson.id, [])
    assert saved == []
    essay_repo.replace_lesson_essay_questions.assert_awaited_once_with(lesson.id, [])


@pytest.mark.asyncio
async def test_sync_lesson_essay_questions_not_found():
    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = None
    essay_repo = AsyncMock()

    use_case = SyncLessonEssayQuestionsUseCase(
        lesson_repo=lesson_repo,
        essay_question_repo=essay_repo,
    )

    with pytest.raises(NotFoundException):
        await use_case.execute(uuid4(), [])


@pytest.mark.parametrize(
    ("question_md", "answer_md"),
    [
        ("", "Valid answer"),
        ("   \n\t  ", "Valid answer"),
        ("Valid question", ""),
        ("Valid question", "   \n  "),
    ],
)
def test_essay_question_schema_rejects_blank_or_whitespace_markdown(
    question_md: str, answer_md: str
):
    with pytest.raises(ValidationError):
        LessonEssayQuestionCreate(question_md=question_md, answer_md=answer_md)


def test_essay_question_model_has_on_delete_cascade_fk():
    lesson_id_col = LessonEssayQuestion.__table__.c.lesson_id
    fks = list(lesson_id_col.foreign_keys)
    assert len(fks) == 1
    assert fks[0].target_fullname == "lessons.id"
    assert fks[0].ondelete == "CASCADE"
    assert lesson_id_col.index is True


def test_sync_lesson_essay_questions_route_requires_educator_permission():
    from app.presentation.api.deps import EducatorUser
    from app.presentation.api.routers.lessons import sync_lesson_essay_questions

    assert sync_lesson_essay_questions.__annotations__["user"] is EducatorUser


@pytest.mark.asyncio
async def test_repository_replace_preserves_existing_updates_and_deletes_removed():
    lesson_id = uuid4()
    keep_id = uuid4()
    remove_id = uuid4()
    new_id = uuid4()
    original_created = datetime(2026, 1, 1, 10, 0, 0)

    existing_keep = LessonEssayQuestion(
        id=keep_id,
        lesson_id=lesson_id,
        question_md="Old Q",
        answer_md="Old A",
        order=0,
        created_at=original_created,
        updated_at=original_created,
    )
    existing_remove = LessonEssayQuestion(
        id=remove_id,
        lesson_id=lesson_id,
        question_md="Remove Q",
        answer_md="Remove A",
        order=1,
        created_at=original_created,
        updated_at=original_created,
    )

    session = AsyncMock()
    session.add = MagicMock()

    first_scalars = MagicMock()
    first_scalars.all.return_value = [existing_keep, existing_remove]
    first_result = MagicMock()
    first_result.scalars.return_value = first_scalars

    second_scalars = MagicMock()
    second_scalars.all.return_value = [existing_keep]
    second_result = MagicMock()
    second_result.scalars.return_value = second_scalars

    session.execute.side_effect = [first_result, second_result]

    repo = LessonEssayQuestionRepository(session)
    await repo.replace_lesson_essay_questions(
        lesson_id,
        [
            LessonEssayQuestionEntity(
                id=keep_id,
                lesson_id=lesson_id,
                question_md="Updated Q",
                answer_md="Updated A",
                order=0,
            ),
            LessonEssayQuestionEntity(
                id=new_id,
                lesson_id=lesson_id,
                question_md="New Q",
                answer_md="New A",
                order=1,
            ),
        ],
    )

    assert existing_keep.question_md == "Updated Q"
    assert existing_keep.answer_md == "Updated A"
    assert existing_keep.created_at == original_created
    session.add.assert_called_once()
    session.delete.assert_awaited_once_with(existing_remove)
    session.flush.assert_awaited_once()
