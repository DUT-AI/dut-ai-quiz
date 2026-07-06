import pytest
from unittest.mock import AsyncMock
from uuid import uuid4
from datetime import datetime

from app.domain.entities.game import GameSessionEntity
from app.domain.value_objects import GameSessionStatus
from app.application.use_cases.game import (
    GetActiveGameSessionUseCase,
    FinishGameSessionUseCase
)
from app.core.datetime_utils import now_ict

@pytest.mark.asyncio
async def test_get_active_session_found():
    """Test case: Trả về active session nếu có 1 session đang IN_PROGRESS và khớp lesson_slug."""
    ps_repo = AsyncMock()
    
    user_id = 1
    lesson_slug = "test-lesson"
    session_id = uuid4()
    
    mock_session = GameSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        snapshot={"lesson_slug": lesson_slug},
        tags_filter=[lesson_slug],
        question_limit=10
    )
    
    ps_repo.get_active_by_lesson.return_value = mock_session
    
    use_case = GetActiveGameSessionUseCase(ps_repo)
    result = await use_case.execute(user_id=user_id, lesson_slug=lesson_slug)
    
    assert result is not None
    assert result.id == session_id
    assert result.status == GameSessionStatus.IN_PROGRESS
    assert result.tags_filter == [lesson_slug]
    ps_repo.get_active_by_lesson.assert_called_once_with(user_id, lesson_slug)
 
@pytest.mark.asyncio
async def test_get_active_session_not_found():
    """Test case: Trả về None nếu không tìm thấy session nào IN_PROGRESS cho lesson_slug."""
    ps_repo = AsyncMock()
    
    user_id = 1
    lesson_slug = "test-lesson"
    
    ps_repo.get_active_by_lesson.return_value = None
    
    use_case = GetActiveGameSessionUseCase(ps_repo)
    result = await use_case.execute(user_id=user_id, lesson_slug=lesson_slug)
    
    assert result is None
    ps_repo.get_active_by_lesson.assert_called_once_with(user_id, lesson_slug)
 
@pytest.mark.asyncio
async def test_finish_practice_session_success():
    """Test case: Hoàn thành session (Restart/Abandon) sẽ đổi trạng thái sang COMPLETED."""
    ps_repo = AsyncMock()
    
    user_id = 1
    session_id = uuid4()
    
    mock_session = GameSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        snapshot={"lesson_slug": "test-lesson"},
        tags_filter=["test-lesson"],
        question_limit=10
    )
    
    ps_repo.get.return_value = mock_session
    # Mock save to return the modified entity
    ps_repo.save.side_effect = lambda entity: entity
    ps_repo.count_completed_by_lesson.return_value = 0
    
    use_case = FinishGameSessionUseCase(ps_repo)
    result = await use_case.execute(session_id=session_id, user_id=user_id)
    
    assert result is not None
    assert result.status == GameSessionStatus.COMPLETED
    assert result.completed_at is not None
    ps_repo.get.assert_called_once_with(session_id)
    ps_repo.save.assert_called_once()
 
@pytest.mark.asyncio
async def test_finish_practice_session_not_found():
    """Test case: Finish session không thuộc về user đó hoặc không tồn tại sẽ trả về None."""
    ps_repo = AsyncMock()
    
    user_id = 1
    session_id = uuid4()
    
    ps_repo.get.return_value = None
    
    use_case = FinishGameSessionUseCase(ps_repo)
    result = await use_case.execute(session_id=session_id, user_id=user_id)
    
    assert result is None
    ps_repo.get.assert_called_once_with(session_id)
    ps_repo.save.assert_not_called()
 
@pytest.mark.asyncio
async def test_finish_practice_session_already_completed():
    """Test case: Session đã COMPLETED từ trước thì không thay đổi gì và không save lại."""
    ps_repo = AsyncMock()
    
    user_id = 1
    session_id = uuid4()
    completed_time = now_ict()
    
    mock_session = GameSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=completed_time,
        status=GameSessionStatus.COMPLETED,
        snapshot={"lesson_slug": "test-lesson"},
        tags_filter=["test-lesson"],
        question_limit=10
    )
    
    ps_repo.get.return_value = mock_session
    
    use_case = FinishGameSessionUseCase(ps_repo)
    result = await use_case.execute(session_id=session_id, user_id=user_id)
    
    assert result is not None
    assert result.status == GameSessionStatus.COMPLETED
    assert result.completed_at == completed_time
    ps_repo.get.assert_called_once_with(session_id)
    ps_repo.save.assert_not_called()
