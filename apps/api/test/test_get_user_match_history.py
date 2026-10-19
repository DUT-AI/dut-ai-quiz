from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.dtos.user import UserOut
from app.application.services.user_service import UserService
from app.application.use_cases.game.get_user_match_history import GetUserMatchHistoryUseCase
from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository
from app.domain.value_objects import GameSessionStatus


@pytest.fixture
def mock_repo():
    return AsyncMock(spec=IGameSessionRepository)


@pytest.fixture
def mock_user_service():
    return AsyncMock(spec=UserService)


@pytest.mark.asyncio
async def test_get_user_match_history_empty(mock_repo, mock_user_service):
    mock_repo.list_completed_by_user_and_lesson.return_value = []
    mock_user_service.get_user_info.return_value = UserOut(
        id=1, name="Hero", email="hero@dutai.site", avatar_url="https://img.com/hero.png"
    )

    uc = GetUserMatchHistoryUseCase(ps_repo=mock_repo, user_service=mock_user_service)
    res = await uc.execute(user_id=1, lesson_slug="tong-quan-ve-python")

    assert res.user_id == 1
    assert res.username == "Hero"
    assert res.total_attempts == 0
    assert len(res.history) == 0
    assert res.highest_score == 0.0


@pytest.mark.asyncio
async def test_get_user_match_history_with_sessions(mock_repo, mock_user_service):
    s1 = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        started_at=datetime(2026, 10, 19, 10, 0),
        completed_at=datetime(2026, 10, 19, 10, 5),
        status=GameSessionStatus.COMPLETED,
        snapshot={
            "lesson_slug": "tong-quan-ve-python",
            "gamification": {
                "final_score": 100.0,
                "points": 120,
                "gold": 50,
                "total_time_response": 30.5,
                "correct_count": 8,
                "lives": 2,
                "last_question_index": 10,
            },
            "questions": [
                {"id": f"q{i}", "content": f"Secret Question {i}", "options": []} for i in range(10)
            ],
            "answers": {f"q{i}": f"opt{i}" for i in range(10)},
        },
        tags_filter=["tong-quan-ve-python"],
        question_limit=10,
    )

    mock_repo.list_completed_by_user_and_lesson.return_value = [s1]
    mock_user_service.get_user_info.return_value = UserOut(
        id=1, name="Hero", email="hero@dutai.site", avatar_url="https://img.com/hero.png"
    )

    uc = GetUserMatchHistoryUseCase(ps_repo=mock_repo, user_service=mock_user_service)
    res = await uc.execute(user_id=1, lesson_slug="tong-quan-ve-python")

    assert res.total_attempts == 1
    assert res.highest_score == 100.0
    assert res.total_gold == 50
    item = res.history[0]
    assert item.attempt_number == 1
    assert item.final_score == 100.0
    assert item.correct_count == 8
    assert item.total_questions == 10
    assert item.accuracy_percentage == 80.0
    assert item.is_completed is True
    # Ensure no secret content is leaked in schema
    assert not hasattr(item, "content")
    assert not hasattr(item, "options")
    assert not hasattr(item, "answers")
