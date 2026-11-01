from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.lessons.get_lesson_by_slug_uc import (
    GetLessonBySlugUseCase,
)
from app.application.use_cases.lessons.get_lesson_detail_uc import (
    GetLessonDetailUseCase,
)
from app.domain.entities.lesson import LessonEntity
from app.domain.entities.lesson_video import LessonVideoEntity
from app.domain.exceptions.exceptions import NotFoundException


@pytest.mark.asyncio
async def test_get_lesson_by_slug_includes_videos():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Đại số tuyến tính",
        description="Ma trận và định thức",
        order=1,
        slug="dai-so-tuyen-tinh",
        created_at=datetime.now(),
        content_md="# Nội dung",
    )

    video1 = LessonVideoEntity(
        id=uuid4(),
        lesson_id=lesson_id,
        title="Video 1: Giới thiệu ma trận",
        url="https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s",
        youtube_video_id="Zf-VMEgCxGE",
        start_seconds=3179,
        order=0,
    )
    video2 = LessonVideoEntity(
        id=uuid4(),
        lesson_id=lesson_id,
        title="Video 2: Định thức",
        url="https://youtu.be/abcdefghijk",
        youtube_video_id="abcdefghijk",
        start_seconds=0,
        order=1,
    )

    lesson_repo = AsyncMock()
    lesson_repo.get_by_slug.return_value = lesson

    question_repo = AsyncMock()
    question_repo.list_all.return_value = []

    video_repo = AsyncMock()
    video_repo.list_by_lesson_id.return_value = [video1, video2]

    use_case = GetLessonBySlugUseCase(
        lesson_repo=lesson_repo,
        question_repo=question_repo,
        video_repo=video_repo,
    )

    result = await use_case.execute("dai-so-tuyen-tinh")

    assert result["slug"] == "dai-so-tuyen-tinh"
    assert len(result["videos"]) == 2
    assert result["videos"][0].title == "Video 1: Giới thiệu ma trận"
    assert result["videos"][0].start_seconds == 3179
    assert result["videos"][1].youtube_video_id == "abcdefghijk"


@pytest.mark.asyncio
async def test_get_lesson_by_slug_not_found():
    lesson_repo = AsyncMock()
    lesson_repo.get_by_slug.return_value = None
    question_repo = AsyncMock()
    video_repo = AsyncMock()

    use_case = GetLessonBySlugUseCase(
        lesson_repo=lesson_repo,
        question_repo=question_repo,
        video_repo=video_repo,
    )

    with pytest.raises(NotFoundException):
        await use_case.execute("non-existent-slug")


@pytest.mark.asyncio
async def test_get_lesson_detail_includes_videos():
    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Hàm số",
        description="Đồ thị hàm số",
        order=1,
        slug="ham-so",
        created_at=datetime.now(),
    )
    video = LessonVideoEntity(
        id=uuid4(),
        lesson_id=lesson_id,
        title="Khảo sát hàm số",
        url="https://www.youtube.com/watch?v=Zf-VMEgCxGE",
        youtube_video_id="Zf-VMEgCxGE",
        start_seconds=0,
        order=0,
    )

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson

    question_repo = AsyncMock()
    question_repo.list_all.return_value = []

    video_repo = AsyncMock()
    video_repo.list_by_lesson_id.return_value = [video]

    use_case = GetLessonDetailUseCase(
        lesson_repo=lesson_repo,
        question_repo=question_repo,
        video_repo=video_repo,
    )

    result = await use_case.execute(str(lesson_id))

    assert result is not None
    assert len(result["videos"]) == 1
    assert result["videos"][0].title == "Khảo sát hàm số"


@pytest.mark.asyncio
async def test_sync_lesson_videos_use_case():
    from app.application.use_cases.lessons.sync_lesson_videos_uc import (
        SyncLessonVideosUseCase,
    )
    from app.presentation.schemas.lessons import LessonVideoCreate

    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Hàm số",
        description="",
        order=1,
        slug="ham-so",
        created_at=datetime.now(),
    )

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson

    video_repo = AsyncMock()
    video_repo.replace_lesson_videos.side_effect = lambda lid, vids: vids

    use_case = SyncLessonVideosUseCase(lesson_repo=lesson_repo, video_repo=video_repo)

    items = [
        LessonVideoCreate(
            title="Video 1",
            url="https://www.youtube.com/watch?v=Zf-VMEgCxGE&t=3179s",
            description="Phần 1",
            order=0,
        ),
        LessonVideoCreate(
            title="Video 2",
            url="https://youtu.be/12345678901?t=15",
            order=1,
        ),
    ]

    saved = await use_case.execute(lesson_id, items)

    assert len(saved) == 2
    assert saved[0].youtube_video_id == "Zf-VMEgCxGE"
    assert saved[0].start_seconds == 3179
    assert saved[1].youtube_video_id == "12345678901"
    assert saved[1].start_seconds == 15
    video_repo.replace_lesson_videos.assert_awaited_once()


@pytest.mark.asyncio
async def test_sync_lesson_videos_not_found():
    from app.application.use_cases.lessons.sync_lesson_videos_uc import (
        SyncLessonVideosUseCase,
    )

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = None
    video_repo = AsyncMock()

    use_case = SyncLessonVideosUseCase(lesson_repo=lesson_repo, video_repo=video_repo)

    with pytest.raises(NotFoundException):
        await use_case.execute(uuid4(), [])


@pytest.mark.asyncio
async def test_sync_lesson_videos_invalid_url():
    from app.application.use_cases.lessons.sync_lesson_videos_uc import (
        SyncLessonVideosUseCase,
    )
    from app.presentation.schemas.lessons import LessonVideoCreate

    lesson_id = uuid4()
    lesson = LessonEntity(
        id=lesson_id,
        name="Hàm số",
        description="",
        order=1,
        slug="ham-so",
        created_at=datetime.now(),
    )

    lesson_repo = AsyncMock()
    lesson_repo.get.return_value = lesson
    video_repo = AsyncMock()

    use_case = SyncLessonVideosUseCase(lesson_repo=lesson_repo, video_repo=video_repo)

    items = [
        LessonVideoCreate(
            title="Video không hợp lệ",
            url="https://not-youtube.com/video123",
        )
    ]

    with pytest.raises(ValueError, match="Đường dẫn video phải là link YouTube hợp lệ"):
        await use_case.execute(lesson_id, items)


@pytest.mark.asyncio
async def test_lesson_video_repo_operations():
    from unittest.mock import MagicMock

    from app.infrastructure.repositories.lesson_videos import LessonVideoRepository

    session = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = None
    session.execute.return_value = mock_result

    repo = LessonVideoRepository(session)
    assert await repo.delete(uuid4()) is False
