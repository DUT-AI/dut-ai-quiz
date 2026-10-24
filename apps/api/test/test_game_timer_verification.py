from datetime import datetime, timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game.get_active_game_session import GetActiveGameSessionUseCase
from app.application.use_cases.game.patch_game_answer import PatchGameAnswerUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.domain.value_objects.gamification import (
    GameSessionSnapshot,
    GamificationState,
    QuestionSnapshot,
)
from app.presentation.schemas.game import GamificationAnswerPatchIn


def test_gamification_state_timer_helpers():
    state = GamificationState()
    assert state.is_question_timer_stale(60) is True

    state.reset_question_timer()
    assert state.current_question_started_at is not None
    assert state.is_question_timer_stale(60) is False

    # Simulate started 100 seconds ago for a 60s limit
    started_past = now_ict() - timedelta(seconds=100)
    state.current_question_started_at = started_past.isoformat()
    assert state.is_question_timer_stale(60, buffer=10.0) is True

    # Clear timer
    state.clear_question_timer()
    assert state.current_question_started_at is None
    assert state.is_question_timer_stale(60) is True


@pytest.mark.asyncio
async def test_get_active_game_session_initializes_cleared_timer():
    ps_repo = AsyncMock()

    q_snap = QuestionSnapshot(id="q-1", content="Numpy question", options=[], time_limit=60)
    gamification = GamificationState(last_question_index=0, current_question_started_at=None)
    snap = GameSessionSnapshot(lesson_slug="numpy", questions=[q_snap], answers={}, gamification=gamification)

    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        started_at=datetime.utcnow(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        snapshot=snap.to_dict(),
        tags_filter=["numpy"],
        question_limit=1,
    )
    ps_repo.get_active_by_lesson.return_value = session

    use_case = GetActiveGameSessionUseCase(ps_repo)
    result = await use_case.execute(user_id=1, lesson_slug="numpy")

    assert result is not None
    updated_snap = result.get_snapshot_state()
    # current_question_started_at must now be set
    assert updated_snap.gamification.current_question_started_at is not None
    ps_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_get_active_game_session_refreshes_stale_timer():
    ps_repo = AsyncMock()

    # Session started 2 hours ago
    stale_time = (now_ict() - timedelta(hours=2)).isoformat()
    q_snap = QuestionSnapshot(id="q-1", content="Numpy question", options=[], time_limit=60)
    gamification = GamificationState(last_question_index=0, current_question_started_at=stale_time)
    snap = GameSessionSnapshot(lesson_slug="numpy", questions=[q_snap], answers={}, gamification=gamification)

    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        started_at=datetime.utcnow(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        snapshot=snap.to_dict(),
        tags_filter=["numpy"],
        question_limit=1,
    )
    ps_repo.get_active_by_lesson.return_value = session

    use_case = GetActiveGameSessionUseCase(ps_repo)
    result = await use_case.execute(user_id=1, lesson_slug="numpy")

    assert result is not None
    updated_snap = result.get_snapshot_state()
    # Timer should be refreshed, so it is no longer stale
    assert updated_snap.gamification.is_question_timer_stale(60) is False
    ps_repo.save.assert_called_once()


@pytest.mark.asyncio
async def test_patch_game_answer_clears_timer_for_next_question():
    ps_repo = AsyncMock()
    q_repo = AsyncMock()

    q_id = uuid4()
    opt_correct = QuestionOptionEntity(id="opt-c", text="[2]", is_correct=True)
    opt_wrong = QuestionOptionEntity(id="opt-w", text="[-1, 0, 2]", is_correct=False)

    q_entity = QuestionEntity(
        id=q_id,
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="Numpy code",
        options=[opt_correct, opt_wrong],
        solution=None,
        lesson_id=None,
        tags=["numpy"],
        created_by=1,
        created_at=datetime.utcnow(),
    )
    q_repo.get.return_value = q_entity

    # Session with 2 questions
    q_snap_0 = QuestionSnapshot(id=str(q_id), content="Numpy code", options=[], time_limit=60)
    q_snap_1 = QuestionSnapshot(id=str(uuid4()), content="Next question", options=[], time_limit=60)

    # Timer started 5s ago
    fresh_time = (now_ict() - timedelta(seconds=5)).isoformat()
    gamification = GamificationState(last_question_index=0, current_question_started_at=fresh_time, lives=3)
    snap = GameSessionSnapshot(lesson_slug="numpy", questions=[q_snap_0, q_snap_1], answers={}, gamification=gamification)

    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        started_at=datetime.utcnow(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        snapshot=snap.to_dict(),
        tags_filter=["numpy"],
        question_limit=2,
    )
    ps_repo.get.return_value = session

    use_case = PatchGameAnswerUseCase(ps_repo=ps_repo, question_repo=q_repo, cache=None)
    payload = GamificationAnswerPatchIn(
        question_id=q_id,
        option_id="opt-c",
        time_response=5.0,
        activate_shield=False,
        activate_double_points=False,
    )

    result = await use_case.execute(session_id=session.id, user_id=1, payload=payload)

    # Answer must be correct!
    assert result.is_correct is True
    assert result.correct_option_id == "opt-c"
    # Next question timer must be cleared until fetched!
    assert result.updated_gamification["current_question_started_at"] is None
