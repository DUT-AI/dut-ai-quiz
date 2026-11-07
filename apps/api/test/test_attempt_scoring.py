from datetime import datetime
from uuid import uuid4

from app.domain.entities.attempt import AttemptEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import AttemptStatus, Difficulty, PoolType
from app.presentation.schemas.attempts import (
    AttemptOut,
    ShuffledOptionOut,
    ShuffledQuestionOut,
)


def test_score_attempt_sets_correct_and_total_count():
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
        solution=None,
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
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )

    attempt = AttemptEntity(
        id=uuid4(),
        exam_id=uuid4(),
        user_id=10,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now(),
        score=None,
        status=AttemptStatus.IN_PROGRESS,
        tab_out_count=0,
        shuffle_seed=123,
        shuffle_snapshot=None,
    )

    # 1 correct out of 2 -> 5.0 points
    score = attempt.score_attempt([q1, q2], {q1_id: "opt1", q2_id: "opt4"})
    assert score == 5.0
    assert attempt.score == 5.0
    assert attempt.correct_count == 1
    assert attempt.total_questions == 2

    # Serialize to AttemptOut schema
    out = AttemptOut.model_validate(attempt)
    assert out.score == 5.0
    assert out.correct_count == 1
    assert out.total_questions == 2


def test_shuffled_question_out_exposes_both_id_and_question_id():
    qid = str(uuid4())
    q = ShuffledQuestionOut(
        question_id=qid,
        content="Test content",
        options=[ShuffledOptionOut(id="opt1", text="Text 1", fixed=False)],
    )
    assert q.question_id == qid
    assert q.id == qid
