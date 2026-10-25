from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4

import pytest
from app.application.services.game_items.microscope import MicroscopeItemStrategy
from app.application.services.game_items.registry import GameItemRegistry
from app.application.services.game_items.time_freeze import TimeFreezeItemStrategy
from app.application.services.game_items.turn_buff import TurnBuffItemStrategy
from app.application.use_cases.game.use_item_game import UseItemGameUseCase
from app.domain.entities.game import GameSessionEntity
from app.domain.exceptions import (
    DomainValidationException,
    EntityNotFoundException,
    InsufficientResourceException,
)
from app.domain.interfaces.game_items import IGameItemStrategy
from app.domain.interfaces.game_session_repo import IGameSessionRepository
from app.domain.interfaces.question_repo import IQuestionRepository
from app.domain.value_objects.game_items import (
    ItemExecutionContext,
    ItemExecutionResult,
)
from app.domain.value_objects.gamification import (
    GamificationItem,
    GamificationState,
    QuestionMeta,
)
from app.presentation.schemas.game import GamificationUseItemIn


@pytest.fixture
def mock_question_repo():
    repo = AsyncMock(spec=IQuestionRepository)
    return repo


@pytest.fixture
def mock_session_repo():
    repo = AsyncMock(spec=IGameSessionRepository)
    return repo


def create_dummy_session(
    is_boss: bool = False, gold: int = 200, current_q_id: str | None = None
) -> GameSessionEntity:
    q_id = current_q_id or str(uuid4())
    state = GamificationState(gold=gold)
    meta = QuestionMeta(id=q_id, tier=1, is_boss=is_boss, time_limit=60)
    session = GameSessionEntity(
        id=uuid4(),
        user_id=1,
        lesson_slug="lesson-1",
        question_sequence=[meta],
        gamification=state,
    )
    return session


@pytest.mark.asyncio
async def test_microscope_strategy_properties_and_pricing(mock_question_repo):
    strategy = MicroscopeItemStrategy(mock_question_repo)
    assert strategy.item_type == GamificationItem.MICROSCOPE
    assert strategy.is_instant is True

    session_normal = create_dummy_session(is_boss=False)
    ctx_normal = ItemExecutionContext(
        question_id=uuid4(),
        current_question_meta=session_normal.current_question_meta,
        question_repo=mock_question_repo,
    )
    assert strategy.calculate_price(session_normal, ctx_normal) == 50

    session_boss = create_dummy_session(is_boss=True)
    ctx_boss = ItemExecutionContext(
        question_id=uuid4(),
        current_question_meta=session_boss.current_question_meta,
        question_repo=mock_question_repo,
    )
    assert strategy.calculate_price(session_boss, ctx_boss) == 100


@pytest.mark.asyncio
async def test_microscope_strategy_eliminates_two_incorrect_options(mock_question_repo):
    q_id = uuid4()
    session = create_dummy_session(current_q_id=str(q_id))

    opt_correct = MagicMock(id=uuid4(), is_correct=True)
    opt_wrong1 = MagicMock(id=uuid4(), is_correct=False)
    opt_wrong2 = MagicMock(id=uuid4(), is_correct=False)
    opt_wrong3 = MagicMock(id=uuid4(), is_correct=False)
    mock_q = MagicMock(options=[opt_correct, opt_wrong1, opt_wrong2, opt_wrong3])
    mock_question_repo.get.return_value = mock_q

    strategy = MicroscopeItemStrategy(mock_question_repo)
    ctx = ItemExecutionContext(
        question_id=q_id,
        current_question_meta=session.current_question_meta,
        question_repo=mock_question_repo,
    )

    strategy.validate(session, ctx)
    result = await strategy.apply(session, ctx)

    assert result.item_name == "microscope"
    assert len(result.eliminated_option_ids) == 2
    assert str(opt_correct.id) not in result.eliminated_option_ids
    for eliminated_id in result.eliminated_option_ids:
        assert eliminated_id in [str(opt_wrong1.id), str(opt_wrong2.id), str(opt_wrong3.id)]


@pytest.mark.asyncio
async def test_microscope_strategy_question_not_found(mock_question_repo):
    q_id = uuid4()
    session = create_dummy_session(current_q_id=str(q_id))
    mock_question_repo.get.return_value = None

    strategy = MicroscopeItemStrategy(mock_question_repo)
    ctx = ItemExecutionContext(
        question_id=q_id,
        current_question_meta=session.current_question_meta,
        question_repo=mock_question_repo,
    )

    with pytest.raises(EntityNotFoundException):
        await strategy.apply(session, ctx)


@pytest.mark.asyncio
async def test_time_freeze_strategy(mock_question_repo):
    strategy = TimeFreezeItemStrategy()
    assert strategy.item_type == GamificationItem.TIME_FREEZE
    assert strategy.is_instant is True

    session_normal = create_dummy_session(is_boss=False)
    ctx = ItemExecutionContext(
        question_id=uuid4(),
        current_question_meta=session_normal.current_question_meta,
        question_repo=mock_question_repo,
    )
    assert strategy.calculate_price(session_normal, ctx) == 40

    session_boss = create_dummy_session(is_boss=True)
    ctx_boss = ItemExecutionContext(
        question_id=uuid4(),
        current_question_meta=session_boss.current_question_meta,
        question_repo=mock_question_repo,
    )
    assert strategy.calculate_price(session_boss, ctx_boss) == 80

    result = await strategy.apply(session_normal, ctx)
    assert result.item_name == "time_freeze"
    assert result.time_freeze_active is True
    assert result.eliminated_option_ids == []


@pytest.mark.asyncio
async def test_turn_buff_strategy_rejects_instant_use(mock_question_repo):
    shield_strategy = TurnBuffItemStrategy(GamificationItem.SHIELD)
    assert shield_strategy.is_instant is False

    session = create_dummy_session()
    ctx = ItemExecutionContext(
        question_id=uuid4(),
        current_question_meta=session.current_question_meta,
        question_repo=mock_question_repo,
    )

    with pytest.raises(DomainValidationException) as exc:
        shield_strategy.validate(session, ctx)
    assert "must be activated when submitting your answer" in str(exc.value)


@pytest.mark.asyncio
async def test_game_item_registry_lookup_and_custom_extension(mock_question_repo):
    registry = GameItemRegistry()
    registry.register(MicroscopeItemStrategy(mock_question_repo))
    registry.register(TimeFreezeItemStrategy())

    # Lookup by enum and name
    s1 = registry.get(GamificationItem.MICROSCOPE)
    assert isinstance(s1, MicroscopeItemStrategy)
    s2 = registry.get_by_name("time_freeze")
    assert isinstance(s2, TimeFreezeItemStrategy)

    # Invalid name
    with pytest.raises(DomainValidationException):
        registry.get_by_name("unknown_potion")

    # Custom extension strategy (Open/Closed Principle)
    class CustomLuckyDiceStrategy(IGameItemStrategy):
        @property
        def item_type(self) -> GamificationItem:
            return GamificationItem.DOUBLE_POINTS

        @property
        def is_instant(self) -> bool:
            return True

        def validate(self, session, context):
            pass

        def calculate_price(self, session, context):
            return 10

        async def apply(self, session, context):
            return ItemExecutionResult(item_name="double_points", metadata={"lucky": True})

    custom_strat = CustomLuckyDiceStrategy()
    registry.register(custom_strat)
    assert registry.get(GamificationItem.DOUBLE_POINTS) is custom_strat


@pytest.mark.asyncio
async def test_use_item_use_case_success_and_atomic_gold_deduction(
    mock_session_repo, mock_question_repo
):
    q_id = uuid4()
    session = create_dummy_session(gold=150, current_q_id=str(q_id))
    mock_session_repo.get.return_value = session

    opt_correct = MagicMock(id=uuid4(), is_correct=True)
    opt_wrong1 = MagicMock(id=uuid4(), is_correct=False)
    opt_wrong2 = MagicMock(id=uuid4(), is_correct=False)
    mock_question_repo.get.return_value = MagicMock(options=[opt_correct, opt_wrong1, opt_wrong2])

    registry = GameItemRegistry(
        [
            MicroscopeItemStrategy(mock_question_repo),
            TimeFreezeItemStrategy(),
            TurnBuffItemStrategy(GamificationItem.DOUBLE_POINTS),
            TurnBuffItemStrategy(GamificationItem.SHIELD),
        ]
    )

    use_case = UseItemGameUseCase(mock_session_repo, mock_question_repo, registry)
    payload = GamificationUseItemIn(item_name="microscope", question_id=q_id)

    res = await use_case.execute(session_id=session.id, user_id=session.user_id, payload=payload)

    assert res.item_name == "microscope"
    assert len(res.eliminated_option_ids) == 2
    assert res.updated_gamification.gold == 100  # 150 - 50 = 100
    mock_session_repo.save.assert_awaited_once_with(session)


@pytest.mark.asyncio
async def test_use_item_use_case_insufficient_gold_does_not_mutate(
    mock_session_repo, mock_question_repo
):
    q_id = uuid4()
    session = create_dummy_session(gold=20, current_q_id=str(q_id))  # Microscope costs 50
    mock_session_repo.get.return_value = session

    registry = GameItemRegistry(
        [
            MicroscopeItemStrategy(mock_question_repo),
            TimeFreezeItemStrategy(),
        ]
    )

    use_case = UseItemGameUseCase(mock_session_repo, mock_question_repo, registry)
    payload = GamificationUseItemIn(item_name="microscope", question_id=q_id)

    with pytest.raises(InsufficientResourceException):
        await use_case.execute(session_id=session.id, user_id=session.user_id, payload=payload)

    assert session.gamification.gold == 20  # Gold not deducted
    mock_session_repo.save.assert_not_called()


@pytest.mark.asyncio
async def test_microscope_with_fewer_than_two_incorrect_options(mock_question_repo):
    q_id = uuid4()
    session = create_dummy_session(current_q_id=str(q_id))

    opt_correct = MagicMock(id=uuid4(), is_correct=True)
    opt_wrong1 = MagicMock(id=uuid4(), is_correct=False)
    mock_question_repo.get.return_value = MagicMock(options=[opt_correct, opt_wrong1])

    strategy = MicroscopeItemStrategy(mock_question_repo)
    ctx = ItemExecutionContext(
        question_id=q_id,
        current_question_meta=session.current_question_meta,
        question_repo=mock_question_repo,
    )

    result = await strategy.apply(session, ctx)
    assert len(result.eliminated_option_ids) == 1
    assert result.eliminated_option_ids == [str(opt_wrong1.id)]


@pytest.mark.asyncio
async def test_use_item_session_not_in_progress(mock_session_repo, mock_question_repo):
    from app.domain.value_objects import GameSessionStatus

    session = create_dummy_session()
    session.status = GameSessionStatus.COMPLETED
    mock_session_repo.get.return_value = session

    registry = GameItemRegistry([MicroscopeItemStrategy(mock_question_repo)])
    use_case = UseItemGameUseCase(mock_session_repo, mock_question_repo, registry)

    payload = GamificationUseItemIn(item_name="microscope", question_id=uuid4())
    with pytest.raises(DomainValidationException) as exc:
        await use_case.execute(session_id=session.id, user_id=session.user_id, payload=payload)
    assert "Session is not in progress" in str(exc.value)


@pytest.mark.asyncio
async def test_use_item_mismatched_question_id(mock_session_repo, mock_question_repo):
    q_id = uuid4()
    different_q_id = uuid4()
    session = create_dummy_session(current_q_id=str(q_id))
    mock_session_repo.get.return_value = session

    registry = GameItemRegistry([MicroscopeItemStrategy(mock_question_repo)])
    use_case = UseItemGameUseCase(mock_session_repo, mock_question_repo, registry)

    payload = GamificationUseItemIn(item_name="microscope", question_id=different_q_id)
    with pytest.raises(DomainValidationException) as exc:
        await use_case.execute(session_id=session.id, user_id=session.user_id, payload=payload)
    assert "Question ID does not match" in str(exc.value)


@pytest.mark.asyncio
async def test_use_item_atomic_rollback_on_apply_failure(mock_session_repo, mock_question_repo):
    q_id = uuid4()
    session = create_dummy_session(gold=100, current_q_id=str(q_id))
    mock_session_repo.get.return_value = session

    # Question not found causes apply() to raise EntityNotFoundException
    mock_question_repo.get.return_value = None

    registry = GameItemRegistry([MicroscopeItemStrategy(mock_question_repo)])
    use_case = UseItemGameUseCase(mock_session_repo, mock_question_repo, registry)

    payload = GamificationUseItemIn(item_name="microscope", question_id=q_id)
    with pytest.raises(EntityNotFoundException):
        await use_case.execute(session_id=session.id, user_id=session.user_id, payload=payload)

    # Gold must NOT be deducted if apply() fails
    assert session.gamification.gold == 100
    mock_session_repo.save.assert_not_called()
