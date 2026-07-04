import pytest
from unittest.mock import AsyncMock
from uuid import uuid4

from app.application.use_cases.practice.practice_use_case import (
    GetPracticeLeaderboardUseCase,
    FinishPracticeSessionUseCase,
)
from app.infrastructure.cache.practice_leaderboard_cache import PracticeLeaderboardCache
from app.domain.interfaces import IPracticeSessionRepository
from app.domain.entities.practice import PracticeSessionEntity
from app.domain.value_objects import PracticeSessionStatus
from app.core.datetime_utils import now_ict


@pytest.fixture
def mock_repo():
    return AsyncMock(spec=IPracticeSessionRepository)


@pytest.fixture
def mock_cache():
    return AsyncMock(spec=PracticeLeaderboardCache)


@pytest.mark.asyncio
async def test_get_leaderboard_cache_hit(mock_repo, mock_cache):
    """Test GetPracticeLeaderboardUseCase returns data from cache if available."""
    lesson_slug = "test-lesson"
    cached_data = [
        {"user_id": 1, "username": "User1", "final_score": 100, "gold": 50, "total_time_response": 20, "attempt_count": 1}
    ]
    mock_cache.get.return_value = cached_data
    
    use_case = GetPracticeLeaderboardUseCase(ps_repo=mock_repo, cache=mock_cache)
    
    result = await use_case.execute(lesson_slug)
    
    assert result == cached_data
    mock_cache.get.assert_called_once_with(lesson_slug)
    mock_repo.get_leaderboard_by_lesson.assert_not_called()
    mock_cache.set.assert_not_called()


@pytest.mark.asyncio
async def test_get_leaderboard_cache_miss(mock_repo, mock_cache):
    """Test GetPracticeLeaderboardUseCase queries DB and updates cache on miss."""
    lesson_slug = "test-lesson"
    db_data = [
        {"user_id": 2, "username": "User2", "final_score": 90, "gold": 40, "total_time_response": 30, "attempt_count": 2}
    ]
    
    mock_cache.get.return_value = None
    mock_repo.get_leaderboard_by_lesson.return_value = db_data
    
    use_case = GetPracticeLeaderboardUseCase(ps_repo=mock_repo, cache=mock_cache)
    
    result = await use_case.execute(lesson_slug, limit=50)
    
    assert result == db_data
    mock_cache.get.assert_called_once_with(lesson_slug)
    mock_repo.get_leaderboard_by_lesson.assert_called_once_with(lesson_slug, 50)
    mock_cache.set.assert_called_once_with(lesson_slug, db_data)


@pytest.mark.asyncio
async def test_finish_session_computes_decay_and_invalidates_cache(mock_repo, mock_cache):
    """Test that when a session is finished, it calculates the decay factor properly and invalidates cache."""
    user_id = 1
    session_id = uuid4()
    lesson_slug = "test-lesson"
    
    mock_session = PracticeSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=PracticeSessionStatus.IN_PROGRESS,
        snapshot={
            "lesson_slug": lesson_slug,
            "gamification": {
                "points": 100,
                "gold": 50,
            }
        },
        tags_filter=[lesson_slug],
        question_limit=10
    )
    
    mock_repo.get.return_value = mock_session
    mock_repo.save.side_effect = lambda entity: entity
    
    # Simulate that the user has already completed 2 sessions for this lesson
    # So this is their 3rd attempt
    # Decay should be: 1.0 - (2 * 0.2) = 0.6
    mock_repo.count_completed_by_lesson.return_value = 2
    
    use_case = FinishPracticeSessionUseCase(ps_repo=mock_repo, cache=mock_cache)
    
    result = await use_case.execute(session_id, user_id)
    
    assert result is not None
    assert result.status == PracticeSessionStatus.COMPLETED
    assert result.completed_at is not None
    
    gamification = result.snapshot["gamification"]
    
    # 100 * 0.6 = 60.0
    assert gamification["final_score"] == 60.0
    # Attempt count is the count of previous completed + 1
    assert gamification["attempt_count"] == 3
    
    # Cache MUST be invalidated for the leaderboard to refresh
    mock_cache.invalidate.assert_called_once_with(lesson_slug)


@pytest.mark.asyncio
async def test_finish_session_decay_minimum_limit(mock_repo, mock_cache):
    """Test that the decay factor doesn't drop below 0.2 even after many attempts."""
    user_id = 1
    session_id = uuid4()
    lesson_slug = "test-lesson"
    
    mock_session = PracticeSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=PracticeSessionStatus.IN_PROGRESS,
        snapshot={
            "lesson_slug": lesson_slug,
            "gamification": {
                "points": 100,
            }
        },
        tags_filter=[lesson_slug],
        question_limit=10
    )
    
    mock_repo.get.return_value = mock_session
    mock_repo.save.side_effect = lambda entity: entity
    
    # 10 previous attempts! Decay would mathematically be 1.0 - (10 * 0.2) = -1.0
    # But max(0.2, ...) should cap it at 0.2
    mock_repo.count_completed_by_lesson.return_value = 10
    
    use_case = FinishPracticeSessionUseCase(ps_repo=mock_repo, cache=mock_cache)
    result = await use_case.execute(session_id, user_id)
    
    gamification = result.snapshot["gamification"]
    assert gamification["final_score"] == 20.0  # 100 * 0.2
    assert gamification["attempt_count"] == 11
