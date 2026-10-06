from uuid import uuid4

from app.domain.value_objects.gamification import (
    GameSessionSnapshot,
    GamificationItem,
    GamificationState,
    QuestionSnapshot,
)


def test_gamification_state_item_pricing_and_gold():
    state = GamificationState(gold=100)

    # Regular price
    assert state.get_item_price(GamificationItem.MICROSCOPE, is_boss=False) == 50
    assert state.get_item_price(GamificationItem.DOUBLE_POINTS, is_boss=False) == 100
    assert state.get_item_price(GamificationItem.SHIELD, is_boss=False) == 80
    assert state.get_item_price(GamificationItem.TIME_FREEZE, is_boss=False) == 40

    # Boss price (2x)
    assert state.get_item_price(GamificationItem.MICROSCOPE, is_boss=True) == 100
    assert state.get_item_price(GamificationItem.DOUBLE_POINTS, is_boss=True) == 200

    # Gold checks
    assert state.has_enough_gold(100) is True
    assert state.has_enough_gold(101) is False

    state.deduct_gold(60)
    assert state.gold == 40
    assert state.has_enough_gold(50) is False


def test_gamification_state_time_freeze():
    initial_iso = "2026-10-06T12:00:00"
    state = GamificationState(current_question_started_at=initial_iso)
    state.apply_time_freeze(seconds=30)
    assert state.current_question_started_at == "2026-10-06T12:00:30"


def test_gamification_state_shield():
    state = GamificationState()
    assert state.can_use_shield_in_tier(1) is True

    state.record_shield_used(1)
    assert state.can_use_shield_in_tier(1) is False
    assert state.can_use_shield_in_tier(2) is True


def test_gamification_state_correct_answer_scoring():
    state = GamificationState(points=0, gold=0, correct_count=0)

    # Fast response (speed ratio <= 0.3): base 10 + speed bonus 5 = 15 points; gold 20 + 15 = 35
    pts, coins = state.record_correct_answer(
        time_response=10.0,
        time_limit=60,
        is_boss=False,
        double_points=False,
    )
    assert pts == 15
    assert coins == 35
    assert state.points == 15
    assert state.gold == 35
    assert state.correct_count == 1

    # Boss + Double points: 4x points
    pts_boss, _ = state.record_correct_answer(
        time_response=50.0,
        time_limit=60,
        is_boss=True,
        double_points=True,
    )
    assert pts_boss == 40  # base 10 * 2 (boss) * 2 (double_points)
    assert state.boss_hp == 0


def test_gamification_state_incorrect_answer_lives():
    # Regular question lost 1 life
    state = GamificationState(lives=3)
    state.record_incorrect_answer(is_boss=False, shield_activated=False)
    assert state.lives == 2

    # Boss question lost 2 lives
    state.record_incorrect_answer(is_boss=True, shield_activated=False)
    assert state.lives == 0

    # Shield prevents life loss
    state_shield = GamificationState(lives=3)
    state_shield.record_incorrect_answer(is_boss=True, shield_activated=True)
    assert state_shield.lives == 3


def test_gamification_state_advance_question_and_tier():
    q1 = QuestionSnapshot(id="1", content="Q1", tier=1, is_boss=False)
    q2 = QuestionSnapshot(id="2", content="Q2", tier=1, is_boss=True)
    q3 = QuestionSnapshot(id="3", content="Q3", tier=2, is_boss=False)
    questions = [q1, q2, q3]

    state = GamificationState(lives=2, current_tier=1, last_question_index=0)

    # Advance to Q2 (boss)
    state.advance_question(questions)
    assert state.last_question_index == 1
    assert state.current_tier == 1
    assert state.boss_hp == 1

    # Advance to Q3 (tier 2): should heal +2 lives (up to 5)
    state.advance_question(questions)
    assert state.last_question_index == 2
    assert state.current_tier == 2
    assert state.lives == 4
    assert state.boss_hp == 0


def test_gamification_state_finalize_score():
    state = GamificationState(points=100)
    # First attempt (count_completed=0) -> decay 1.0 -> 100
    state.finalize_score(count_completed=0)
    assert state.final_score == 100.0
    assert state.attempt_count == 1

    # Second attempt (count_completed=1) -> decay 0.8 -> 80
    state.finalize_score(count_completed=1)
    assert state.final_score == 80.0
    assert state.attempt_count == 2


def test_game_session_snapshot_roundtrip():
    q_id = str(uuid4())
    snapshot = GameSessionSnapshot(
        lesson_slug="lesson-1",
        questions=[
            QuestionSnapshot(
                id=q_id,
                content="What is Python?",
                options=[{"id": "opt1", "text": "Language"}],
                time_limit=60,
                tier=1,
            )
        ],
        answers={},
        gamification=GamificationState(lives=3, gold=50, points=20),
    )

    d = snapshot.to_dict()
    assert d["lesson_slug"] == "lesson-1"
    assert len(d["questions"]) == 1
    assert d["gamification"]["gold"] == 50

    reconstructed = GameSessionSnapshot.from_dict(d)
    assert reconstructed.lesson_slug == "lesson-1"
    assert reconstructed.questions[0].content == "What is Python?"
    assert reconstructed.gamification.gold == 50

    # Test record answer
    reconstructed.record_answer(q_id, "opt1", 12.5)
    assert reconstructed.answers[q_id] == "opt1"
    assert reconstructed.questions[0].time_response == 12.5
    assert reconstructed.gamification.total_time_response == 12.5
