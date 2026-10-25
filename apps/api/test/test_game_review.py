from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game import GetGameSessionReviewUseCase
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.entities.game_answer import GameSessionAnswerEntity
from app.domain.exceptions import EntityNotFoundException
from app.domain.value_objects import GameSessionStatus
from app.domain.value_objects.gamification import GamificationState, QuestionMeta


class MockOption:
    def __init__(self, id, content, is_correct=False):
        self.id = id
        self.content = content
        self.is_correct = is_correct


class MockQuestion:
    def __init__(self, id, content, options, solution="Explanation step-by-step"):
        self.id = id
        self.content = content
        self.options = options
        self.solution = solution


@pytest.mark.asyncio
async def test_get_game_session_review_success():
    """Verify review use case returns chronological answer timeline with explanations and scores."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    session_id = uuid4()
    q1_id = uuid4()
    q2_id = uuid4()

    opt1_correct = uuid4()
    opt1_wrong = uuid4()
    opt2_correct = uuid4()
    opt2_wrong = uuid4()

    q1 = MockQuestion(
        id=q1_id,
        content="What is Python?",
        options=[
            MockOption(opt1_correct, "Programming Language", is_correct=True),
            MockOption(opt1_wrong, "Snake only", is_correct=False),
        ],
        solution="Python is a high-level interpreted programming language.",
    )
    q2 = MockQuestion(
        id=q2_id,
        content="What is 2 * 3?",
        options=[
            MockOption(opt2_correct, "6", is_correct=True),
            MockOption(opt2_wrong, "5", is_correct=False),
        ],
        solution="Multiplication of 2 and 3 equals 6.",
    )

    async def get_question(qid):
        if str(qid) == str(q1_id):
            return q1
        if str(qid) == str(q2_id):
            return q2
        return None

    question_repo.get.side_effect = get_question

    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=now_ict(),
        status=GameSessionStatus.COMPLETED,
        question_sequence=[
            QuestionMeta(id=str(q1_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(q2_id), tier=1, is_boss=False, time_limit=60),
        ],
        gamification=GamificationState(
            lives=3,
            gold=20,
            points=180,
            current_tier=1,
            last_question_index=2,
            correct_count=2,
            final_score=180.0,
        ),
        tags_filter=["python-basics"],
        question_limit=2,
    )
    ps_repo.get.return_value = session

    ans1 = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=session_id,
        question_id=q1_id,
        option_id=opt1_correct,
        is_correct=True,
        time_response=4.2,
        points_gained=100,
        gold_gained=10,
        answered_at=now_ict(),
    )
    ans2 = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=session_id,
        question_id=q2_id,
        option_id=opt2_correct,
        is_correct=True,
        time_response=2.8,
        points_gained=80,
        gold_gained=10,
        answered_at=now_ict(),
    )
    answer_repo.list_by_session.return_value = [ans1, ans2]

    use_case = GetGameSessionReviewUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        answer_repo=answer_repo,
    )

    review = await use_case.execute(session_id=session_id, user_id=1)

    assert review.session_id == str(session_id)
    assert review.user_id == 1
    assert review.final_score == 180.0
    assert review.total_questions == 2
    assert review.correct_count == 2
    assert len(review.answers) == 2

    # Check Question 1 review item
    item1 = review.answers[0]
    assert item1.question_id == str(q1_id)
    assert item1.question_content == "What is Python?"
    assert item1.selected_option_id == str(opt1_correct)
    assert item1.correct_option_id == str(opt1_correct)
    assert item1.is_correct is True
    assert item1.time_response == 4.2
    assert item1.points_gained == 100
    assert item1.explanation == "Python is a high-level interpreted programming language."
    assert len(item1.options) == 2

    # Check Question 2 review item
    item2 = review.answers[1]
    assert item2.question_id == str(q2_id)
    assert item2.question_content == "What is 2 * 3?"
    assert item2.selected_option_id == str(opt2_correct)
    assert item2.correct_option_id == str(opt2_correct)
    assert item2.is_correct is True
    assert item2.time_response == 2.8
    assert item2.points_gained == 80
    assert item2.explanation == "Multiplication of 2 and 3 equals 6."


@pytest.mark.asyncio
async def test_get_game_session_review_not_found_or_forbidden():
    """Verify review raises EntityNotFoundException when session does not exist or belongs to another user."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    ps_repo.get.return_value = None
    use_case = GetGameSessionReviewUseCase(ps_repo, question_repo, answer_repo)

    with pytest.raises(EntityNotFoundException):
        await use_case.execute(session_id=uuid4(), user_id=1)

    # Session exists but belongs to user 999
    ps_repo.get.return_value = GameSessionEntity(
        id=uuid4(),
        user_id=999,
        started_at=now_ict(),
        completed_at=now_ict(),
        status=GameSessionStatus.COMPLETED,
    )
    with pytest.raises(EntityNotFoundException):
        await use_case.execute(session_id=uuid4(), user_id=1)
