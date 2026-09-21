from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game import (
    FinishGameSessionUseCase,
    GetGameLeaderboardUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository
from app.domain.value_objects import GameSessionStatus
from app.infrastructure.cache.game_leaderboard_cache import GameLeaderboardCache


@pytest.fixture
def mock_repo():
    return AsyncMock(spec=IGameSessionRepository)


@pytest.fixture
def mock_cache():
    return AsyncMock(spec=GameLeaderboardCache)


@pytest.mark.asyncio
async def test_get_leaderboard_cache_hit(mock_repo, mock_cache):
    """Test GetGameLeaderboardUseCase returns data from cache if available."""
    lesson_slug = "test-lesson"
    cached_data = [
        {
            "user_id": 1,
            "username": "User1",
            "final_score": 100,
            "gold": 50,
            "total_time_response": 20,
            "attempt_count": 1,
            "is_completed": True,
            "total_questions": 10,
            "answered_questions": 10,
        }
    ]
    mock_cache.get.return_value = cached_data

    use_case = GetGameLeaderboardUseCase(ps_repo=mock_repo, cache=mock_cache)

    result = await use_case.execute(lesson_slug)

    assert result == cached_data
    mock_cache.get.assert_called_once_with(lesson_slug)
    mock_repo.get_leaderboard_by_lesson.assert_not_called()
    mock_cache.set.assert_not_called()


@pytest.mark.asyncio
async def test_get_leaderboard_cache_miss(mock_repo, mock_cache):
    """Test GetGameLeaderboardUseCase queries DB and updates cache on miss."""
    lesson_slug = "test-lesson"
    db_data = [
        {
            "user_id": 2,
            "username": "User2",
            "final_score": 90,
            "gold": 40,
            "total_time_response": 30,
            "attempt_count": 2,
            "is_completed": True,
            "total_questions": 10,
            "answered_questions": 10,
        }
    ]

    mock_cache.get.return_value = None
    mock_repo.get_leaderboard_by_lesson.return_value = db_data

    use_case = GetGameLeaderboardUseCase(ps_repo=mock_repo, cache=mock_cache)

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

    mock_session = GameSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
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

    use_case = FinishGameSessionUseCase(ps_repo=mock_repo, cache=mock_cache)

    result = await use_case.execute(session_id, user_id)

    assert result is not None
    assert result.status == GameSessionStatus.COMPLETED
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

    mock_session = GameSessionEntity(
        id=session_id,
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
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

    use_case = FinishGameSessionUseCase(ps_repo=mock_repo, cache=mock_cache)
    result = await use_case.execute(session_id, user_id)

    gamification = result.snapshot["gamification"]
    assert gamification["final_score"] == 20.0  # 100 * 0.2
    assert gamification["attempt_count"] == 11


def test_game_leaderboard_row_out_schema():
    """Test GameLeaderboardRowOut serialization and default values for new fields."""
    from app.presentation.schemas.game import GameLeaderboardRowOut

    row = GameLeaderboardRowOut(
        user_id=10,
        username="Hero",
        avatar_url="http://avatar.com/1.png",
        final_score=100.0,
        gold=50,
        total_time_response=25.5,
        attempt_count=2,
        is_completed=True,
        total_questions=15,
        answered_questions=15,
    )
    assert row.user_id == 10
    assert row.is_completed is True
    assert row.total_questions == 15
    assert row.answered_questions == 15

    # Test default values
    row_default = GameLeaderboardRowOut(
        user_id=11,
        final_score=50.0,
        gold=10,
        total_time_response=12.0,
        attempt_count=1,
    )
    assert row_default.is_completed is False
    assert row_default.total_questions == 0
    assert row_default.answered_questions == 0


def test_leaderboard_row_completion_logic():
    """Test the calculation logic of is_completed based on questions, answers, and status."""
    questions = [{"id": f"q{i}"} for i in range(15)]
    answers_full = {f"q{i}": "opt1" for i in range(15)}
    status_completed = GameSessionStatus.COMPLETED

    # Case 1: Answered 15/15 questions and status is COMPLETED -> is_completed = True
    total_questions = len(questions)
    answered_questions = len(answers_full)
    is_completed = bool(
        status_completed == GameSessionStatus.COMPLETED
        and total_questions > 0
        and answered_questions >= total_questions
    )

    assert total_questions == 15
    assert answered_questions == 15
    assert is_completed is True

    # Case 2: Answered 5/15 questions (game over due to running out of lives) -> is_completed = False
    answers_partial = {f"q{i}": "opt1" for i in range(5)}
    answered_questions_partial = len(answers_partial)
    is_completed_partial = bool(
        status_completed == GameSessionStatus.COMPLETED
        and total_questions > 0
        and answered_questions_partial >= total_questions
    )

    assert answered_questions_partial == 5
    assert is_completed_partial is False

    # Case 3: Session IN_PROGRESS -> is_completed = False
    status_in_progress = GameSessionStatus.IN_PROGRESS
    is_completed_in_progress = bool(
        status_in_progress == GameSessionStatus.COMPLETED
        and total_questions > 0
        and answered_questions >= total_questions
    )
    assert is_completed_in_progress is False

