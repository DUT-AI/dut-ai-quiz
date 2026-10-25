from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.services.game_hydration import GameHydrationService
from app.application.use_cases.game import (
    FinishGameSessionUseCase,
    PatchGameAnswerUseCase,
    StartGameSessionUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.domain.value_objects.gamification import GamificationState, QuestionMeta
from app.presentation.schemas.game import (
    GamificationAnswerPatchIn,
    GamificationStartIn,
)


class MockOption:
    def __init__(self, id, content, is_correct=False):
        self.id = id
        self.content = content
        self.is_correct = is_correct

    def to_dict(self):
        return {"id": str(self.id), "content": self.content, "is_correct": self.is_correct}


class MockQuestion:
    def __init__(self, id, difficulty, content, options):
        self.id = id
        self.difficulty = difficulty
        self.content = content
        self.options = options
        self.pool_type = PoolType.GAME


@pytest.mark.asyncio
async def test_start_game_session_stores_metadata_only():
    """Verify start_game_session produces only QuestionMeta sequence without static text in session state."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    lesson_repo = AsyncMock()

    lesson_repo.get_by_identifier.return_value = None
    ps_repo.get_active_by_lesson.return_value = None
    ps_repo.list_history.return_value = []

    # Mock 15 questions in bank
    mock_questions = [
        MockQuestion(
            id=uuid4(),
            difficulty=Difficulty.EASY
            if i < 5
            else (Difficulty.MEDIUM if i < 10 else Difficulty.HARD),
            content=f"Question {i} Content",
            options=[MockOption(uuid4(), f"Option {j}", j == 0) for j in range(4)],
        )
        for i in range(15)
    ]
    question_repo.list_all.return_value = mock_questions
    question_repo.get.side_effect = lambda q_id: next(
        (q for q in mock_questions if q.id == q_id), None
    )
    ps_repo.add.side_effect = lambda entity: entity

    hydration = GameHydrationService(question_repo)
    use_case = StartGameSessionUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        lesson_repo=lesson_repo,
        hydration=hydration,
    )

    created_session = await use_case.execute(
        user_id=1, payload=GamificationStartIn(lesson_slug="math-101")
    )

    assert created_session is not None
    saved_entity = ps_repo.add.call_args[0][0]
    assert len(saved_entity.question_sequence) == 10
    # Verify each item in question_sequence is QuestionMeta and does NOT contain options or content
    for q_meta in saved_entity.question_sequence:
        assert isinstance(q_meta, QuestionMeta)
        assert hasattr(q_meta, "id")
        assert hasattr(q_meta, "tier")
        assert hasattr(q_meta, "is_boss")
        assert not hasattr(q_meta, "content")
        assert not hasattr(q_meta, "options")

    # Verify session contains flat fields and gamification
    assert created_session.id == saved_entity.id
    assert created_session.current_question is not None
    assert created_session.gamification is not None
    assert created_session.question_limit == 10


@pytest.mark.asyncio
async def test_patch_answer_appends_to_answer_repo():
    """Verify submitting an answer writes an append-only log and advances turn."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()
    answer_repo = AsyncMock()

    q1_id = uuid4()
    q2_id = uuid4()
    opt1_correct = uuid4()
    opt1_wrong = uuid4()
    opt2_correct = uuid4()

    q1_db = MockQuestion(
        id=q1_id,
        difficulty=Difficulty.EASY,
        content="What is 2+2?",
        options=[
            MockOption(opt1_correct, "4", is_correct=True),
            MockOption(opt1_wrong, "5", is_correct=False),
        ],
    )
    q2_db = MockQuestion(
        id=q2_id,
        difficulty=Difficulty.EASY,
        content="What is 3+3?",
        options=[
            MockOption(opt2_correct, "6", is_correct=True),
        ],
    )

    async def get_question(qid):
        if qid == q1_id:
            return q1_db
        if qid == q2_id:
            return q2_db
        return None

    question_repo.get.side_effect = get_question

    session_id = uuid4()
    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[
            QuestionMeta(id=str(q1_id), tier=1, is_boss=False, time_limit=60),
            QuestionMeta(id=str(q2_id), tier=1, is_boss=True, time_limit=30),
        ],
        gamification=GamificationState(
            lives=3, gold=10, points=0, current_tier=1, last_question_index=0
        ),
        lesson_slug="math-101",
        question_limit=2,
    )
    ps_repo.get.return_value = session
    ps_repo.save.side_effect = lambda s: s
    answer_repo.get_by_turn.return_value = None
    answer_repo.add.side_effect = lambda a: a

    hydration = GameHydrationService(question_repo)
    use_case = PatchGameAnswerUseCase(
        ps_repo=ps_repo,
        question_repo=question_repo,
        answer_repo=answer_repo,
        hydration=hydration,
    )

    # 1. Answer Question 1 correctly
    result = await use_case.execute(
        session_id=session_id,
        user_id=1,
        payload=GamificationAnswerPatchIn(
            question_id=q1_id,
            option_id=str(opt1_correct),
            time_response=4.5,
        ),
    )

    assert result.is_correct is True
    assert result.points_gained > 0
    assert result.is_game_over is False
    # Next question must be hydrated
    assert result.next_question is not None
    assert result.next_question.id == str(q2_id)
    assert result.next_question.content == "What is 3+3?"

    # Verify append-only record was added to answer repository
    assert answer_repo.add.called
    added_answer = answer_repo.add.call_args[0][0]
    assert added_answer.session_id == session_id
    assert added_answer.question_id == q1_id
    assert added_answer.is_correct is True


@pytest.mark.asyncio
async def test_finish_game_session():
    """Verify finishing a game session updates status and finalizes score."""
    ps_repo = AsyncMock()
    session_id = uuid4()
    session = GameSessionEntity(
        id=session_id,
        user_id=1,
        started_at=now_ict(),
        completed_at=None,
        status=GameSessionStatus.IN_PROGRESS,
        question_sequence=[QuestionMeta(id=str(uuid4()), tier=1, is_boss=False, time_limit=60)],
        gamification=GamificationState(
            lives=3, gold=50, points=100, current_tier=1, last_question_index=1
        ),
        lesson_slug="math-101",
        question_limit=1,
    )
    ps_repo.get.return_value = session
    ps_repo.save.side_effect = lambda s: s
    ps_repo.count_completed_by_lesson.return_value = 0

    q_repo = AsyncMock()
    hydration = GameHydrationService(q_repo)
    use_case = FinishGameSessionUseCase(ps_repo=ps_repo, hydration=hydration)
    finished = await use_case.execute(session_id=session_id, user_id=1)

    assert finished is not None
    assert finished.status == GameSessionStatus.COMPLETED.value
    assert finished.completed_at is not None
    assert finished.gamification is not None
    assert finished.gamification.final_score == 100.0


@pytest.mark.asyncio
async def test_game_session_answer_repository_integrity_error_mapped_to_conflict():
    """Verify that GameSessionAnswerRepository catches IntegrityError and raises DomainValidationException 409."""
    from app.domain.entities.game_answer import GameSessionAnswerEntity
    from app.domain.exceptions import DomainValidationException
    from app.infrastructure.repositories.game_answers import GameSessionAnswerRepository
    from sqlalchemy.exc import IntegrityError

    mock_session = AsyncMock()
    mock_session.flush.side_effect = IntegrityError(
        "Unique constraint violation", params=None, orig=Exception()
    )

    repo = GameSessionAnswerRepository(mock_session)
    ans = GameSessionAnswerEntity(
        id=uuid4(),
        session_id=uuid4(),
        question_id=uuid4(),
        option_id=str(uuid4()),
        is_correct=True,
        time_response=1.5,
        points_gained=10,
        gold_gained=5,
        answered_at=now_ict(),
    )
    with pytest.raises(DomainValidationException) as exc_info:
        await repo.add(ans)

    assert exc_info.value.status_code == 409
    assert "already answered" in exc_info.value.message.lower()
    mock_session.rollback.assert_awaited_once()
