from datetime import datetime
from uuid import uuid4

import pytest
from app.application.use_cases.exams.delete_exam_attempt_uc import (
    DeleteExamAttemptUseCase,
)
from app.application.use_cases.exams.get_student_attempts_uc import (
    GetStudentAttemptsUseCase,
)
from app.domain.entities.attempt import (
    AttemptAnswerEntity,
    AttemptEntity,
    FocusEventEntity,
)
from app.domain.entities.exam import ExamEntity
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.value_objects import AttemptStatus, ExamAccessScope, ShuffledSnapshot
from app.domain.value_objects.enums import Difficulty, PoolType
from fastapi import HTTPException


class MockExamRepo:
    def __init__(self, exam):
        self.exam = exam

    async def get(self, exam_id):
        return self.exam if self.exam and self.exam.id == exam_id else None


class MockAttemptRepo:
    def __init__(self, attempts=None, answers=None):
        self.attempts = attempts or []
        self.answers = answers or []
        self.deleted_attempts = []

    async def list_for_user_and_exam(self, exam_id, user_id):
        return [
            a for a in self.attempts if a.exam_id == exam_id and a.user_id == user_id
        ]

    async def get(self, attempt_id):
        for a in self.attempts:
            if a.id == attempt_id:
                return a
        return None

    async def list_answers(self, attempt_id):
        return [ans for ans in self.answers if ans.attempt_id == attempt_id]

    async def delete_attempt(self, attempt_id):
        before = len(self.attempts)
        self.attempts = [a for a in self.attempts if a.id != attempt_id]
        self.answers = [ans for ans in self.answers if ans.attempt_id != attempt_id]
        if len(self.attempts) < before:
            self.deleted_attempts.append(attempt_id)
            return True
        return False


class MockExamQuestionRepo:
    def __init__(self, questions):
        self.questions = questions

    async def load_questions_ordered(self, exam_id):
        return self.questions


class MockQuestionRepo:
    def __init__(self, questions):
        self.q_map = {q.id: q for q in questions}

    async def get(self, qid):
        return self.q_map.get(qid)


class MockFocusEventRepo:
    def __init__(self, events=None):
        self.events = events or []

    async def list_for_attempt(self, attempt_id):
        return [e for e in self.events if e.attempt_id == attempt_id]


@pytest.mark.asyncio
async def test_get_student_attempts_with_reconstruction():
    exam_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()

    q1 = QuestionEntity(
        id=q1_id,
        content="Question 1",
        difficulty=Difficulty.EASY,
        pool_type=PoolType.EXAM,
        options=[
            QuestionOptionEntity(id=str(uuid4()), text="Option 1A", is_correct=True),
            QuestionOptionEntity(id=str(uuid4()), text="Option 1B", is_correct=False),
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )
    q2 = QuestionEntity(
        id=q2_id,
        content="Question 2",
        difficulty=Difficulty.MEDIUM,
        pool_type=PoolType.EXAM,
        options=[
            QuestionOptionEntity(id=str(uuid4()), text="Option 2A", is_correct=False),
            QuestionOptionEntity(id=str(uuid4()), text="Option 2B", is_correct=True),
        ],
        solution=None,
        lesson_id=None,
        tags=[],
        created_by=1,
        created_at=datetime.now(),
    )

    exam = ExamEntity(
        id=exam_id,
        title="Test Exam",
        description="",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=3,
        is_published=True,
        access_scope=ExamAccessScope.PUBLIC,
        created_by=1,
        participant_ids=[],
    )

    attempt_id = uuid4()
    opt1_correct_id = str(q1.options[0].id)
    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=101,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        expires_at=datetime.now(),
        score=5.0,
        status=AttemptStatus.COMPLETED,
        tab_out_count=1,
        shuffle_seed=42,
        shuffle_snapshot=ShuffledSnapshot(
            question_order=[str(q2_id), str(q1_id)],
            options={str(q1_id): [str(q1.options[1].id), str(q1.options[0].id)]},
        ),
    )

    ans1 = AttemptAnswerEntity(
        id=uuid4(),
        attempt_id=attempt_id,
        question_id=q1_id,
        selected_option_id=opt1_correct_id,
    )

    fe1 = FocusEventEntity(
        id=uuid4(),
        attempt_id=attempt_id,
        client_event_id="fe_1",
        event="mouse_leave",
        received_at=datetime.now(),
    )

    exam_repo = MockExamRepo(exam)
    att_repo = MockAttemptRepo([attempt], [ans1])
    eq_repo = MockExamQuestionRepo([q1, q2])
    q_repo = MockQuestionRepo([q1, q2])
    fe_repo = MockFocusEventRepo([fe1])

    uc = GetStudentAttemptsUseCase(exam_repo, att_repo, eq_repo, q_repo, fe_repo)
    res = await uc.execute(exam_id, 101)

    assert res.student_id == 101
    assert res.total_attempts == 1
    assert res.best_score == 5.0
    assert len(res.attempts) == 1

    att_out = res.attempts[0]
    assert len(att_out.questions) == 2
    # Check question order was reconstructed (q2 was first in snapshot)
    assert att_out.questions[0].id == q2_id
    assert att_out.questions[1].id == q1_id
    assert att_out.questions[1].selected_option_id == opt1_correct_id
    assert att_out.questions[1].is_correct is True

    assert len(att_out.focus_events) == 1
    assert att_out.focus_events[0].event == "mouse_leave"


@pytest.mark.asyncio
async def test_delete_exam_attempt_success():
    exam_id = uuid4()
    attempt_id = uuid4()
    exam = ExamEntity(
        id=exam_id,
        title="Test Exam",
        description="",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=3,
        is_published=True,
        access_scope=ExamAccessScope.PUBLIC,
        created_by=10,
        participant_ids=[],
    )
    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=101,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        expires_at=datetime.now(),
        score=0.0,
        status=AttemptStatus.COMPLETED,
        tab_out_count=2,
        shuffle_seed=None,
        shuffle_snapshot=None,
    )

    exam_repo = MockExamRepo(exam)
    att_repo = MockAttemptRepo([attempt], [])

    uc = DeleteExamAttemptUseCase(exam_repo, att_repo)
    res = await uc.execute(
        exam_id=exam_id,
        attempt_id=attempt_id,
        operator_user_id=10,
        operator_role="educator",
    )

    assert res.success is True
    assert res.deleted_attempt_id == attempt_id
    assert len(att_repo.attempts) == 0


@pytest.mark.asyncio
async def test_delete_exam_attempt_forbidden():
    exam_id = uuid4()
    attempt_id = uuid4()
    exam = ExamEntity(
        id=exam_id,
        title="Test Exam",
        description="",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=3,
        is_published=True,
        access_scope=ExamAccessScope.PUBLIC,
        created_by=10,
        participant_ids=[],
    )
    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=101,
        started_at=datetime.now(),
        completed_at=datetime.now(),
        expires_at=datetime.now(),
        score=0.0,
        status=AttemptStatus.COMPLETED,
        tab_out_count=2,
        shuffle_seed=None,
        shuffle_snapshot=None,
    )

    exam_repo = MockExamRepo(exam)
    att_repo = MockAttemptRepo([attempt], [])

    uc = DeleteExamAttemptUseCase(exam_repo, att_repo)
    with pytest.raises(HTTPException) as exc_info:
        await uc.execute(
            exam_id=exam_id,
            attempt_id=attempt_id,
            operator_user_id=999,  # Not creator and student role
            operator_role="student",
        )
    assert exc_info.value.status_code == 403
