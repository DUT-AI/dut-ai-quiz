from datetime import timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.attempts.attempt_use_case import (
    GetAttemptUseCase,
    PatchAttemptAnswersUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import AttemptEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import (
    AttemptStatus,
    Difficulty,
    PoolType,
    ShuffledSnapshot,
)
from app.presentation.schemas.attempts import AnswerItem, AttemptAnswersPatch


@pytest.mark.asyncio
async def test_patch_answers_allowed_within_grace_period():
    att_repo = AsyncMock()
    user_id = 100
    attempt_id = uuid4()
    now = now_ict()

    # Expires in past 5 seconds (within 10s grace period)
    att = AttemptEntity(
        id=attempt_id,
        exam_id=uuid4(),
        user_id=user_id,
        started_at=now - timedelta(minutes=60),
        completed_at=None,
        expires_at=now - timedelta(seconds=5),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=1,
        shuffle_snapshot=None,
    )
    att_repo.get.return_value = att

    use_case = PatchAttemptAnswersUseCase(att_repo)
    payload = AttemptAnswersPatch(
        answers=[AnswerItem(question_id=uuid4(), selected_option_id="opt1")]
    )
    result = await use_case.execute(attempt_id, user_id, payload)
    assert result is True
    assert att_repo.upsert_answer.await_count == 1


@pytest.mark.asyncio
async def test_patch_answers_rejected_after_grace_period():
    att_repo = AsyncMock()
    user_id = 100
    attempt_id = uuid4()
    now = now_ict()

    # Expired 15 seconds ago (> 10s grace period)
    att = AttemptEntity(
        id=attempt_id,
        exam_id=uuid4(),
        user_id=user_id,
        started_at=now - timedelta(minutes=60),
        completed_at=None,
        expires_at=now - timedelta(seconds=15),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=1,
        shuffle_snapshot=None,
    )
    att_repo.get.return_value = att

    use_case = PatchAttemptAnswersUseCase(att_repo)
    payload = AttemptAnswersPatch(
        answers=[AnswerItem(question_id=uuid4(), selected_option_id="opt1")]
    )
    result = await use_case.execute(attempt_id, user_id, payload)
    assert result is False
    assert att_repo.upsert_answer.await_count == 0


@pytest.mark.asyncio
async def test_get_attempt_bulk_loads_questions():
    att_repo = AsyncMock()
    question_repo = AsyncMock()
    user_id = 100
    attempt_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()

    att = AttemptEntity(
        id=attempt_id,
        exam_id=uuid4(),
        user_id=user_id,
        started_at=now_ict(),
        completed_at=None,
        expires_at=now_ict() + timedelta(minutes=30),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=1,
        shuffle_snapshot=ShuffledSnapshot(
            question_order=[str(q1_id), str(q2_id)],
            options={str(q1_id): ["o1"], str(q2_id): ["o2"]},
        ),
    )
    att_repo.get.return_value = att
    att_repo.list_answers.return_value = []

    q1 = QuestionEntity(
        id=q1_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Q1",
        options=[
            QuestionOptionEntity(id="o1", text="Opt 1", is_correct=True, fixed=False)
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=now_ict(),
    )
    q2 = QuestionEntity(
        id=q2_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Q2",
        options=[
            QuestionOptionEntity(id="o2", text="Opt 2", is_correct=True, fixed=False)
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=now_ict(),
    )
    question_repo.get_by_ids.return_value = [q1, q2]

    use_case = GetAttemptUseCase(att_repo, question_repo)
    result = await use_case.execute(attempt_id, user_id)

    assert result is not None
    assert len(result["questions"]) == 2
    # Verify get_by_ids was called once, not get() in a loop
    question_repo.get_by_ids.assert_awaited_once_with([q1_id, q2_id])
    assert question_repo.get.await_count == 0
