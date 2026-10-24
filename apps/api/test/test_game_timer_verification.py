from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game.patch_game_answer import PatchGameAnswerUseCase
from app.domain.entities.game import GameSessionEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.domain.value_objects.gamification import (
    GameSessionSnapshot,
    GamificationState,
    QuestionSnapshot,
)
from app.presentation.schemas.game import GamificationAnswerPatchIn


@pytest.mark.asyncio
async def test_patch_game_answer_client_duration_success():
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

    q_snap_0 = QuestionSnapshot(id=str(q_id), content="Numpy code", options=[], time_limit=60)
    q_snap_1 = QuestionSnapshot(id=str(uuid4()), content="Next question", options=[], time_limit=60)

    gamification = GamificationState(last_question_index=0, lives=3)
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
        time_response=5.2,
        activate_shield=False,
        activate_double_points=False,
    )

    result = await use_case.execute(session_id=session.id, user_id=1, payload=payload)

    # Server trusts client duration
    assert result.is_correct is True
    assert result.correct_option_id == "opt-c"
    assert result.updated_gamification.last_question_index == 1
    assert result.next_question is not None


@pytest.mark.asyncio
async def test_patch_game_answer_client_duration_exceeded_fails():
    ps_repo = AsyncMock()
    q_repo = AsyncMock()

    q_id = uuid4()
    opt_correct = QuestionOptionEntity(id="opt-c", text="[2]", is_correct=True)

    q_entity = QuestionEntity(
        id=q_id,
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="Numpy code",
        options=[opt_correct],
        solution=None,
        lesson_id=None,
        tags=["numpy"],
        created_by=1,
        created_at=datetime.utcnow(),
    )
    q_repo.get.return_value = q_entity

    q_snap_0 = QuestionSnapshot(id=str(q_id), content="Numpy code", options=[], time_limit=60)

    gamification = GamificationState(last_question_index=0, lives=3)
    snap = GameSessionSnapshot(lesson_slug="numpy", questions=[q_snap_0], answers={}, gamification=gamification)

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
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0

    use_case = PatchGameAnswerUseCase(ps_repo=ps_repo, question_repo=q_repo, cache=None)
    # Client sends time_response exceeding time_limit
    payload = GamificationAnswerPatchIn(
        question_id=q_id,
        option_id="opt-c",
        time_response=65.0,
        activate_shield=False,
        activate_double_points=False,
    )

    result = await use_case.execute(session_id=session.id, user_id=1, payload=payload)

    # Automatically counted as incorrect due to exceeding limit
    assert result.is_correct is False
    assert result.updated_gamification.lives == 2


@pytest.mark.asyncio
async def test_patch_game_answer_idempotent_when_already_answered():
    ps_repo = AsyncMock()
    q_repo = AsyncMock()

    q_id = uuid4()
    opt_correct = QuestionOptionEntity(id="opt-c", text="[2]", is_correct=True)

    q_entity = QuestionEntity(
        id=q_id,
        pool_type=PoolType.PRACTICE,
        difficulty=Difficulty.EASY,
        content="Numpy code",
        options=[opt_correct],
        solution=None,
        lesson_id=None,
        tags=["numpy"],
        created_by=1,
        created_at=datetime.utcnow(),
    )
    q_repo.get.return_value = q_entity

    q_snap_0 = QuestionSnapshot(id=str(q_id), content="Numpy code", options=[], time_limit=60)
    q_snap_1 = QuestionSnapshot(id=str(uuid4()), content="Next question", options=[], time_limit=60)

    gamification = GamificationState(last_question_index=1, lives=3, points=100)
    snap = GameSessionSnapshot(
        lesson_slug="numpy",
        questions=[q_snap_0, q_snap_1],
        answers={str(q_id): "opt-c"},
        gamification=gamification,
    )

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

    assert result.is_correct is True
    assert result.points_gained == 0
    assert result.coins_gained == 0
    assert result.updated_gamification.last_question_index == 1
    assert result.is_game_over is False
