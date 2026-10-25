from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game import PatchGameAnswerUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.entities.game_answer import GameSessionAnswerEntity
from app.domain.exceptions import DomainValidationException
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import GamificationState, QuestionMeta
from app.presentation.schemas.game import GamificationAnswerPatchIn
from sqlalchemy.exc import IntegrityError


class MockOption:
    def __init__(self, id, content, is_correct=False):
        self.id = id
        self.content = content
        self.is_correct = is_correct


class MockQuestion:
    def __init__(self, id, content, options):
        self.id = id
        self.content = content
        self.options = options


@pytest.mark.asyncio
async def test_duplicate_submission_rejected_with_409():
    """Verify submitting a different answer for an already answered turn is rejected with 409."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    session_id = uuid4()
    q_id = uuid4()
    opt1_id = uuid4()
    opt2_id = uuid4()

    q_mock = MockQuestion(
        id=q_id,
        content="What is 2+2?",
        options=[
            MockOption(opt1_id, "4", is_correct=True),
            MockOption(opt2_id, "5", is_correct=False),
        ],
    )
    question_repo.get.return_value = q_mock

    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(uuid4()), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=GamificationState(
            lives=3, gold=0, points=0, current_tier=1, last_question_index=1
        ),
        tags_filter=["math"],
        question_limit=2,
    )
    ps_repo.get.return_value = session

    # Answer already recorded in answer_repo for this turn with opt1_id
    existing_answer = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=session_id,
        question_id=q_id,
        option_id=opt1_id,
        is_correct=True,
        time_response=5.0,
        points_gained=100,
        gold_gained=10,
        answered_at=now_ict(),
    )
    answer_repo.get_by_turn.return_value = existing_answer

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        answer_repo=answer_repo,
    )

    # Participant tries to submit a different option (opt2_id) for the same question
    payload = GamificationAnswerPatchIn(
        question_id=q_id,
        option_id=str(opt2_id),
        time_response=6.0,
    )

    with pytest.raises(DomainValidationException) as exc_info:
        await use_case.execute(session_id=session_id, user_id=1, payload=payload)

    assert exc_info.value.status_code in (400, 409)
    assert "already answered" in exc_info.value.message.lower()


@pytest.mark.asyncio
async def test_idempotent_network_retry_returns_previous_result():
    """Verify an identical duplicate submission returns the previous answer without re-deducting lives."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    session_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()
    opt1_id = uuid4()

    q2_mock = MockQuestion(
        id=q2_id, content="Next question", options=[MockOption(uuid4(), "A", True)]
    )
    question_repo.get.return_value = q2_mock

    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q1_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(q2_id), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=GamificationState(
            lives=2, gold=10, points=100, current_tier=1, last_question_index=1
        ),
        tags_filter=["math"],
        question_limit=2,
    )
    ps_repo.get.return_value = session

    existing_answer = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=session_id,
        question_id=q1_id,
        option_id=opt1_id,
        is_correct=True,
        time_response=3.0,
        points_gained=100,
        gold_gained=10,
        answered_at=now_ict(),
    )
    answer_repo.get_by_turn.return_value = existing_answer

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        answer_repo=answer_repo,
    )

    # Identical retry payload
    payload = GamificationAnswerPatchIn(
        question_id=q1_id,
        option_id=str(opt1_id),
        time_response=3.0,
    )

    result = await use_case.execute(session_id=session_id, user_id=1, payload=payload)

    assert result.is_correct is True
    assert result.points_gained == 0
    assert result.coins_gained == 0
    # Lives must stay intact (2 lives)
    assert result.updated_gamification.lives == 2
    assert result.updated_gamification.points == 100


@pytest.mark.asyncio
async def test_race_condition_integrity_error_mapped_to_conflict():
    """Verify simultaneous insertions resulting in database unique constraint violation raise 409."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    session_id = uuid4()
    q_id = uuid4()
    opt_wrong = uuid4()

    q_mock = MockQuestion(
        id=q_id,
        content="Race test question",
        options=[
            MockOption(uuid4(), "Correct", is_correct=True),
            MockOption(opt_wrong, "Wrong", is_correct=False),
        ],
    )
    question_repo.get.return_value = q_mock

    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[QuestionMeta(id=str(q_id), tier=1, is_boss=False, time_limit=60)],
        gamification=GamificationState(
            lives=3, gold=0, points=0, current_tier=1, last_question_index=0
        ),
        tags_filter=["math"],
        question_limit=1,
    )
    ps_repo.get.return_value = session
    answer_repo.get_by_turn.return_value = None  # Passes preliminary check before race
    # Database unique constraint fails on flush
    answer_repo.add.side_effect = IntegrityError(
        "Unique constraint violation", params=None, orig=Exception()
    )

    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        answer_repo=answer_repo,
    )

    payload = GamificationAnswerPatchIn(
        question_id=q_id,
        option_id=str(opt_wrong),
        time_response=2.5,
    )

    with pytest.raises(DomainValidationException) as exc_info:
        await use_case.execute(session_id=session_id, user_id=1, payload=payload)

    assert exc_info.value.status_code == 409
    assert "already answered" in exc_info.value.message.lower()
