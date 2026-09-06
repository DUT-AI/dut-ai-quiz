from datetime import datetime, timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.game import (
    PatchGameAnswerUseCase,
)
from app.core.datetime_utils import now_ict
from app.domain.entities.game import GameSessionEntity
from app.domain.value_objects import Difficulty, GameSessionStatus, PoolType
from app.presentation.schemas.game import (
    GamificationAnswerPatchIn,
)
from fastapi import HTTPException
from pydantic import ValidationError


# ==========================================
# MOCK CLASSES CHO DATABASE
# ==========================================
class MockQuestionOption:
    def __init__(self, id, text, is_correct):
        self.id = id
        self.text = text
        self.is_correct = is_correct

    def to_dict(self):
        return {"id": str(self.id), "text": self.text, "is_correct": self.is_correct}

class MockQuestion:
    def __init__(self, id, difficulty, content, options):
        self.id = id
        self.difficulty = difficulty
        self.content = content
        self.options = options
        self.pool_type = PoolType.GAME


# ==============================================================================
# NHÓM 1: CORE GAMEPLAY (TRẢ LỜI ĐÚNG / SAI CƠ BẢN)
# ==============================================================================

@pytest.mark.asyncio
async def test_TC_G01_patch_gamification_answer_correct():
    """TC_G01: Trả lời đúng 1 câu hỏi. Điểm/Vàng tăng, máu Boss giảm, tiến độ tăng."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_correct_id = str(uuid4())
    opt_wrong_id = str(uuid4())

    opt_a = MockQuestionOption(opt_correct_id, "Correct Option", True)
    opt_b = MockQuestionOption(opt_wrong_id, "Wrong Option", False)
    q_db = MockQuestion(q_id, Difficulty.EASY, "Question Content", [opt_a, opt_b])
    question_repo.get.return_value = q_db

    session_id = uuid4()
    snapshot = {
        "questions": [
            {
                "id": str(q_id),
                "content": "Question Content",
                "options": [{"id": opt_correct_id, "text": "Correct Option"}],
                "time_limit": 60,
                "time_response": 0,
                "tier": 1,
                "is_boss": False
            },
            {
                "id": str(uuid4()),
                "tier": 1,
                "is_boss": False
            }
        ],
        "answers": {},
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 10, "shield_used_in_tier": {},
            "current_question_started_at": now_ict().isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=2
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    ps_repo.count_completed_by_lesson.return_value = 0

    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(
        question_id=q_id, option_id=opt_correct_id, time_response=10.0,
        activate_shield=False, activate_double_points=False
    )
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.is_correct is True
    assert result.updated_gamification["points"] > 0
    assert result.updated_gamification["gold"] > 100
    assert result.updated_gamification["lives"] == 3 # Máu không đổi
    assert result.updated_gamification["last_question_index"] == 1 # Tiến độ tăng

@pytest.mark.asyncio
async def test_TC_G02_patch_gamification_answer_incorrect_lose_life():
    """TC_G02: Trả lời sai 1 câu hỏi. Máu user giảm 1, tiến độ vẫn tăng để sang câu tiếp."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_correct_id = str(uuid4())
    opt_wrong_id = str(uuid4())

    opt_a = MockQuestionOption(opt_correct_id, "Correct Option", True)
    opt_b = MockQuestionOption(opt_wrong_id, "Wrong Option", False)
    q_db = MockQuestion(q_id, Difficulty.MEDIUM, "Question Content", [opt_a, opt_b])
    question_repo.get.return_value = q_db

    session_id = uuid4()
    snapshot = {
        "questions": [
            {"id": str(q_id), "tier": 1, "is_boss": False, "time_limit": 60},
            {"id": "q2", "tier": 1, "is_boss": False}
        ],
        "answers": {},
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 0, "shield_used_in_tier": {},
            "current_question_started_at": now_ict().isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=2
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    ps_repo.count_completed_by_lesson.return_value = 0

    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(
        question_id=q_id, option_id=opt_wrong_id, time_response=30.0,
        activate_shield=False, activate_double_points=False
    )
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.is_correct is False
    assert result.updated_gamification["lives"] == 2 # 3 - 1
    assert result.updated_gamification["last_question_index"] == 1


# ==============================================================================
# NHÓM 2: TÍNH TIẾN ĐỘ & GAME OVER (PROGRESSION)
# ==============================================================================

@pytest.mark.asyncio
async def test_TC_P01_boss_defeated_advances_tier():
    """TC_P01: Đánh bại Boss (is_boss=True và đúng). Lên tầng mới, thưởng +2 mạng."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_correct_id = str(uuid4())

    opt_a = MockQuestionOption(opt_correct_id, "Correct Option", True)
    q_db = MockQuestion(q_id, Difficulty.EASY, "Question Content", [opt_a])
    question_repo.get.return_value = q_db

    session_id = uuid4()
    snapshot = {
        "questions": [
            {"id": str(q_id), "tier": 1, "is_boss": True, "time_limit": 60},
            {"id": "q2", "tier": 2, "is_boss": False, "time_limit": 120}
        ],
        "answers": {},
        "gamification": {
            "lives": 2, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 1, "shield_used_in_tier": {},
            "current_question_started_at": now_ict().isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=2
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0

    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(
        question_id=q_id, option_id=opt_correct_id, time_response=10.0
    )
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.is_correct is True
    # Kiểm tra phần thưởng qua màn (Nếu có logic +2 mạng)
    # Lưu ý: Sẽ FAIL nếu chưa implement logic thưởng +2 lives khi qua tầng
    assert result.updated_gamification["lives"] == 4
    assert result.updated_gamification["current_tier"] == 2

@pytest.mark.asyncio
async def test_TC_P02_user_loses_all_lives_game_over():
    """TC_P02: Máu rớt từ 1 về 0. Trạng thái Session đổi thành COMPLETED."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_wrong_id = str(uuid4())

    opt_b = MockQuestionOption(opt_wrong_id, "Wrong Option", False)
    q_db = MockQuestion(q_id, Difficulty.MEDIUM, "Question", [opt_b])
    question_repo.get.return_value = q_db

    session_id = uuid4()
    snapshot = {
        "questions": [{"id": str(q_id), "tier": 1, "is_boss": False, "time_limit": 60}],
        "answers": {},
        "gamification": {
            "lives": 1, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 0, "shield_used_in_tier": {},
            "current_question_started_at": now_ict().isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0

    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(question_id=q_id, option_id=opt_wrong_id, time_response=10.0)
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.updated_gamification["lives"] == 0
    assert result.is_game_over is True
    assert session.status == GameSessionStatus.COMPLETED

@pytest.mark.asyncio
async def test_TC_P03_win_game_on_last_question():
    """TC_P03: Trả lời đúng câu cuối cùng của danh sách. Session COMPLETED."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_correct_id = str(uuid4())
    opt_a = MockQuestionOption(opt_correct_id, "Correct Option", True)
    q_db = MockQuestion(q_id, Difficulty.HARD, "Question", [opt_a])
    question_repo.get.return_value = q_db

    session_id = uuid4()
    snapshot = {
        "questions": [{"id": str(q_id), "tier": 3, "is_boss": True, "time_limit": 300}],
        "answers": {},
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 3,
            "last_question_index": 0, "boss_hp": 1, "shield_used_in_tier": {},
            "current_question_started_at": now_ict().isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    ps_repo.count_completed_by_lesson.return_value = 0
    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(question_id=q_id, option_id=opt_correct_id, time_response=10.0)
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.is_game_over is True
    assert session.status == GameSessionStatus.COMPLETED


# ==============================================================================
# NHÓM 3: CHỐNG GIAN LẬN & VALIDATION (ANTI-CHEAT)
# ==============================================================================

@pytest.mark.asyncio
async def test_TC_S01_spam_already_answered_question():
    """TC_S01: Gửi API nộp lần 2 cho 1 câu đã trả lời. Báo lỗi 400."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    session_id = uuid4()
    snapshot = {
        "questions": [{"id": str(q_id), "tier": 1, "is_boss": False}],
        "answers": {str(q_id): "some_option"}, # Đã có lịch sử trả lời
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 1, "boss_hp": 0, "shield_used_in_tier": {}
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(question_id=q_id, option_id=str(uuid4()), time_response=10.0)

    with pytest.raises(HTTPException) as exc:
        await use_case.execute(session_id, user_id=1, payload=payload)
    # Sẽ FAIL nếu UseCase chưa chặn việc trả lời lại câu đã làm
    assert exc.value.status_code == 400
    assert "already answered" in exc.value.detail.lower()

@pytest.mark.asyncio
async def test_TC_S02_negative_time_validation():
    """TC_S02: Validation thời gian âm. Lỗi 422 từ Pydantic."""
    # Test directly on Schema
    with pytest.raises(ValidationError):
        GamificationAnswerPatchIn(
            question_id=uuid4(),
            option_id=str(uuid4()),
            time_response=-5.0 # Thời gian âm
        )

@pytest.mark.asyncio
async def test_TC_S03_timeout_fails_automatically():
    """TC_S03: Quá hạn thời gian (Timeout). Hệ thống tự tính SAI và trừ 1 mạng."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    opt_correct_id = str(uuid4())
    opt_a = MockQuestionOption(opt_correct_id, "Correct", True)
    question_repo.get.return_value = MockQuestion(q_id, Difficulty.MEDIUM, "Content", [opt_a])

    started_at = now_ict() - timedelta(seconds=100) # Đã lố 100s

    session_id = uuid4()
    snapshot = {
        "questions": [{"id": str(q_id), "tier": 1, "is_boss": False, "time_limit": 60}],
        "answers": {},
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 0, "shield_used_in_tier": {},
            "current_question_started_at": started_at.isoformat()
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    # User cố tình truyền thời gian giả (15s) nhưng hệ thống lấy thời gian thực (100s) > 60s
    payload = GamificationAnswerPatchIn(question_id=q_id, option_id=opt_correct_id, time_response=15.0)
    result = await use_case.execute(session_id, user_id=1, payload=payload)

    assert result.is_correct is False # Mặc dù chọn đúng option, nhưng do timeout nên tính là Sai
    assert result.updated_gamification["lives"] == 2 # Bị trừ mạng

@pytest.mark.asyncio
async def test_TC_S04_question_not_in_session():
    """TC_S04: Câu hỏi (question_id) không trùng với câu hỏi hiện tại. Báo lỗi 400."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    session_id = uuid4()
    q_real_id = str(uuid4())
    q_fake_id = uuid4() # ID mà hacker truyền lên

    snapshot = {
        "questions": [{"id": q_real_id, "tier": 1, "is_boss": False}],
        "answers": {},
        "gamification": {
            "lives": 3, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 0, "shield_used_in_tier": {}
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=None,
        status=GameSessionStatus.IN_PROGRESS, snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(question_id=q_fake_id, option_id=str(uuid4()), time_response=10.0)

    with pytest.raises(HTTPException) as exc:
        await use_case.execute(session_id, user_id=1, payload=payload)
    assert exc.value.status_code == 400

@pytest.mark.asyncio
async def test_TC_S05_submit_after_game_over():
    """TC_S05: Nộp câu trả lời khi Session đã COMPLETED (Hết mạng). Báo lỗi 400."""
    ps_repo = AsyncMock()
    question_repo = AsyncMock()

    q_id = uuid4()
    session_id = uuid4()
    snapshot = {
        "questions": [{"id": str(q_id), "tier": 1, "is_boss": False}],
        "answers": {},
        "gamification": {
            "lives": 0, "gold": 100, "points": 0, "current_tier": 1,
            "last_question_index": 0, "boss_hp": 0, "shield_used_in_tier": {}
        }
    }

    session = GameSessionEntity(
        id=session_id, user_id=1, started_at=datetime.utcnow(), completed_at=datetime.utcnow(),
        status=GameSessionStatus.COMPLETED, # Session ĐÃ KẾT THÚC
        snapshot=snapshot, tags_filter=[], question_limit=1
    )
    ps_repo.get.return_value = session
    ps_repo.count_completed_by_lesson.return_value = 0
    ps_repo.count_completed_by_lesson.return_value = 0
    use_case = PatchGameAnswerUseCase(ps_repo, question_repo)

    payload = GamificationAnswerPatchIn(question_id=q_id, option_id=str(uuid4()), time_response=10.0)

    with pytest.raises(HTTPException) as exc:
        await use_case.execute(session_id, user_id=1, payload=payload)
    assert exc.value.status_code == 400
