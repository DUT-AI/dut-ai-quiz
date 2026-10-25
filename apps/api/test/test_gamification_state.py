from app.domain.value_objects.gamification import (
    GamificationItem,
    GamificationState,
    QuestionMeta,
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
    q1 = QuestionMeta(id="1", tier=1, is_boss=False)
    q2 = QuestionMeta(id="2", tier=1, is_boss=True)
    q3 = QuestionMeta(id="3", tier=2, is_boss=False)
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


def test_question_meta_and_gamification_state_roundtrip():
    meta = QuestionMeta(id="q1", tier=2, is_boss=True, time_limit=90)
    meta_dict = meta.to_dict()
    reconstructed_meta = QuestionMeta.from_dict(meta_dict)
    assert reconstructed_meta.id == "q1"
    assert reconstructed_meta.tier == 2
    assert reconstructed_meta.is_boss is True
    assert reconstructed_meta.time_limit == 90

    state = GamificationState(lives=2, gold=75, points=120)
    state_dict = state.to_dict()
    reconstructed_state = GamificationState.from_dict(state_dict)
    assert reconstructed_state.lives == 2
    assert reconstructed_state.gold == 75
    assert reconstructed_state.points == 120
