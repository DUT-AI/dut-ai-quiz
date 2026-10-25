from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.services.game_hydration import GameHydrationService
from app.application.use_cases.game.patch_game_answer import PatchGameAnswerUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.entities.game_answer import GameSessionAnswerEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.domain.value_objects.gamification import (
    GamificationState,
    QuestionMeta,
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
        created_at=now_ict(),
    )
    q_repo.get.return_value = q_entity

    gamification = GamificationState(last_question_index=0, lives=3)

    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        lesson_slug="numpy",
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(uuid4()), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=gamification,
        question_limit=2,
    )
    ps_repo.get.return_value = session
    ans_repo = AsyncMock()
    ans_repo.get_by_turn.return_value = None

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=q_repo,
        answer_repo=ans_repo,
        hydration=GameHydrationService(q_repo),
        cache=None,
    )
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
        created_at=now_ict(),
    )
    q_repo.get.return_value = q_entity

    gamification = GamificationState(last_question_index=0, lives=3)

    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        lesson_slug="numpy",
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q_id), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=gamification,
        question_limit=1,
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0

    ans_repo = AsyncMock()
    ans_repo.get_by_turn.return_value = None

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=q_repo,
        answer_repo=ans_repo,
        hydration=GameHydrationService(q_repo),
        cache=None,
    )
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
        created_at=now_ict(),
    )
    q_repo.get.return_value = q_entity

    gamification = GamificationState(last_question_index=1, lives=3, points=100)

    session_id = uuid4()
    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        lesson_slug="numpy",
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(uuid4()), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=gamification,
        question_limit=2,
    )
    ps_repo.get.return_value = session

    answer_repo = AsyncMock()
    existing_answer = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=session_id,
        question_id=q_id,
        option_id="opt-c",
        is_correct=True,
        time_response=5.0,
        points_gained=100,
        gold_gained=10,
        answered_at=now_ict(),
    )
    answer_repo.get_by_turn.return_value = existing_answer

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=q_repo,
        answer_repo=answer_repo,
        hydration=GameHydrationService(q_repo),
        cache=None,
    )
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
