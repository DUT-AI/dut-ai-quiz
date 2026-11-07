from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.attempts.review_attempt_uc import ReviewAttemptUseCase
from app.domain.entities.attempt import AttemptAnswerEntity, AttemptEntity
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
async def test_review_attempt_reconstructs_student_shuffle_order():
    att_repo = AsyncMock()
    eq_repo = AsyncMock()
    exam_repo = AsyncMock()
    question_repo = AsyncMock()

    exam_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()

    q1 = QuestionEntity(
        id=q1_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Question 1",
        options=[
            QuestionOptionEntity(id="opt1", text="A", is_correct=True, fixed=False),
            QuestionOptionEntity(id="opt2", text="B", is_correct=False, fixed=False),
        ],
        solution="Sol 1",
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )
    q2 = QuestionEntity(
        id=q2_id,
        pool_type=PoolType.EXAM,
        difficulty=Difficulty.EASY,
        content="Question 2",
        options=[
            QuestionOptionEntity(id="opt3", text="C", is_correct=True, fixed=False),
            QuestionOptionEntity(id="opt4", text="D", is_correct=False, fixed=False),
        ],
        solution="Sol 2",
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )

    # Shuffled order: q2 first, then q1; options in q1 reversed: opt2 then opt1
    snapshot = ShuffledSnapshot(
        question_order=[str(q2_id), str(q1_id)],
        options={
            str(q1_id): ["opt2", "opt1"],
            str(q2_id): ["opt3", "opt4"],
        },
    )

    attempt_id = uuid4()
    user_id = 123
    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=user_id,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        expires_at=datetime.now(),
        score=10.0,
        status=AttemptStatus.COMPLETED,
        tab_out_count=0,
        shuffle_seed=999,
        shuffle_snapshot=snapshot,
    )

    exam = ExamEntity(
        id=exam_id,
        title="Sample Exam",
        description="Desc",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=1,
        is_published=True,
        created_by=1,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=True,
    )

    att_repo.get.return_value = attempt
    exam_repo.get.return_value = exam
    att_repo.list_answers.return_value = [
        AttemptAnswerEntity(
            id=uuid4(),
            attempt_id=attempt_id,
            question_id=q1_id,
            selected_option_id="opt1",
        ),
        AttemptAnswerEntity(
            id=uuid4(),
            attempt_id=attempt_id,
            question_id=q2_id,
            selected_option_id="opt3",
        ),
    ]
    question_repo.get_by_ids.return_value = [q1, q2]

    use_case = ReviewAttemptUseCase(att_repo, eq_repo, exam_repo, question_repo)
    result = await use_case.execute(attempt_id, user_id)

    # Verify questions order matches student snapshot (q2 first, then q1)
    review_questions = result["questions"]
    assert len(review_questions) == 2
    assert review_questions[0].id == q2_id
    assert review_questions[1].id == q1_id

    # Verify option order for q1 is opt2 then opt1, and is_correct is preserved
    q1_opts = review_questions[1].options
    assert q1_opts[0].id == "opt2"
    assert q1_opts[0].is_correct is False
    assert q1_opts[1].id == "opt1"
    assert q1_opts[1].is_correct is True

    # Verify in-memory scoring fields
    assert result["attempt"].correct_count == 2
    assert result["attempt"].total_questions == 2
