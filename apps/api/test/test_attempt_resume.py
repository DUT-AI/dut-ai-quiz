from datetime import datetime, timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.attempts.start_attempt_use_case import (
    StartAttemptUseCase,
)
from app.domain.entities.attempt import AttemptEntity
from app.domain.entities.exam import ExamEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import (
    AttemptStatus,
    Difficulty,
    ExamAccessScope,
    PoolType,
    ShuffledSnapshot,
)


@pytest.mark.asyncio
async def test_start_attempt_resumes_active_attempt():
    exam_repo = AsyncMock()
    eq_repo = AsyncMock()
    att_repo = AsyncMock()

    exam_id = uuid4()
    user_id = 789

    exam = ExamEntity(
        id=exam_id,
        title="Resume Exam",
        description="Desc",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=3,
        is_published=True,
        created_by=1,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=False,
    )

    q1_id = uuid4()
    q1 = QuestionEntity(
        id=q1_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Resume Question",
        options=[
            QuestionOptionEntity(id="opt1", text="A", is_correct=True, fixed=False)
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )

    active_attempt = AttemptEntity(
        id=uuid4(),
        exam_id=exam_id,
        user_id=user_id,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now() + timedelta(minutes=45),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=123,
        shuffle_snapshot=ShuffledSnapshot(
            question_order=[str(q1_id)], options={str(q1_id): ["opt1"]}
        ),
    )

    exam_repo.get.return_value = exam
    att_repo.get_active_for_user_exam.return_value = active_attempt
    att_repo.count_completed_for_user_exam.return_value = 0
    eq_repo.load_questions_ordered.return_value = [q1]

    use_case = StartAttemptUseCase(exam_repo, eq_repo, att_repo)

    # Calling start should resume
    result = await use_case.execute(exam_id, user_id, action="start")
    assert result["is_resumed"] is True
    assert result["attempt"].id == active_attempt.id
    assert "saved_answers" in result
    att_repo.list_answers.assert_awaited_once_with(active_attempt.id)


@pytest.mark.asyncio
async def test_start_attempt_restarts_and_abandons_old():
    exam_repo = AsyncMock()
    eq_repo = AsyncMock()
    att_repo = AsyncMock()

    exam_id = uuid4()
    user_id = 789

    exam = ExamEntity(
        id=exam_id,
        title="Restart Exam",
        description="Desc",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=3,
        is_published=True,
        created_by=1,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=False,
    )

    q1_id = uuid4()
    q1 = QuestionEntity(
        id=q1_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Restart Question",
        options=[
            QuestionOptionEntity(id="opt1", text="A", is_correct=True, fixed=False)
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )

    active_attempt = AttemptEntity(
        id=uuid4(),
        exam_id=exam_id,
        user_id=user_id,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now() + timedelta(minutes=45),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=123,
        shuffle_snapshot=ShuffledSnapshot(
            question_order=[str(q1_id)], options={str(q1_id): ["opt1"]}
        ),
    )

    new_attempt = AttemptEntity(
        id=uuid4(),
        exam_id=exam_id,
        user_id=user_id,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now() + timedelta(minutes=60),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=456,
        shuffle_snapshot=None,
    )

    exam_repo.get.return_value = exam
    att_repo.get_active_for_user_exam.return_value = active_attempt
    att_repo.count_completed_for_user_exam.return_value = 0
    eq_repo.load_questions_ordered.return_value = [q1]
    att_repo.add.return_value = new_attempt

    use_case = StartAttemptUseCase(exam_repo, eq_repo, att_repo)

    result = await use_case.execute(exam_id, user_id, action="restart")
    assert result["is_resumed"] is False
    assert active_attempt.status == AttemptStatus.ABANDONED
    att_repo.save.assert_called_once_with(active_attempt)
    att_repo.add.assert_called_once()
