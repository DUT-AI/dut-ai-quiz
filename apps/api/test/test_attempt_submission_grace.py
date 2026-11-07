from datetime import timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.attempts.submit_attempt_use_case import (
    SubmitAttemptUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.attempt import AttemptAnswerEntity, AttemptEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import AttemptStatus, Difficulty, PoolType


@pytest.mark.asyncio
async def test_submit_within_grace_period():
    att_repo = AsyncMock()
    eq_repo = AsyncMock()
    user_id = 100
    attempt_id = uuid4()
    exam_id = uuid4()
    now = now_ict()

    # Expired 30s ago (within 60s grace period)
    att = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=user_id,
        started_at=now - timedelta(minutes=60),
        completed_at=None,
        expires_at=now - timedelta(seconds=30),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=1,
        shuffle_snapshot=None,
    )
    att_repo.get.return_value = att

    q_id = uuid4()
    q = QuestionEntity(
        id=q_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Question",
        options=[
            QuestionOptionEntity(
                id="opt1", text="Option A", is_correct=True, fixed=False
            )
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=now,
    )
    eq_repo.load_questions_ordered.return_value = [q]

    # Student selected opt1
    ans = AttemptAnswerEntity(
        id=uuid4(),
        attempt_id=attempt_id,
        question_id=q_id,
        selected_option_id="opt1",
    )
    att_repo.list_answers.return_value = [ans]

    use_case = SubmitAttemptUseCase(att_repo, eq_repo)
    result_att, code = await use_case.execute(attempt_id, user_id)

    assert code == "ok"
    assert result_att is not None
    assert result_att.status == AttemptStatus.COMPLETED
    assert result_att.score == 10.0
    assert result_att.correct_count == 1
    assert result_att.total_questions == 1
    assert att_repo.save.await_count == 1


@pytest.mark.asyncio
async def test_submit_after_grace_period_is_timed_out():
    att_repo = AsyncMock()
    eq_repo = AsyncMock()
    user_id = 100
    attempt_id = uuid4()
    exam_id = uuid4()
    now = now_ict()

    # Expired 90s ago (> 60s grace period)
    att = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=user_id,
        started_at=now - timedelta(minutes=60),
        completed_at=None,
        expires_at=now - timedelta(seconds=90),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=1,
        shuffle_snapshot=None,
    )
    att_repo.get.return_value = att

    q_id = uuid4()
    q = QuestionEntity(
        id=q_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Question",
        options=[
            QuestionOptionEntity(
                id="opt1", text="Option A", is_correct=True, fixed=False
            )
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=now,
    )
    eq_repo.load_questions_ordered.return_value = [q]

    ans = AttemptAnswerEntity(
        id=uuid4(),
        attempt_id=attempt_id,
        question_id=q_id,
        selected_option_id="opt1",
    )
    att_repo.list_answers.return_value = [ans]

    use_case = SubmitAttemptUseCase(att_repo, eq_repo)
    result_att, code = await use_case.execute(attempt_id, user_id)

    assert code == "timed_out"
    assert result_att is not None
    assert result_att.status == AttemptStatus.COMPLETED
    assert result_att.score == 10.0
    assert att_repo.save.await_count == 1
