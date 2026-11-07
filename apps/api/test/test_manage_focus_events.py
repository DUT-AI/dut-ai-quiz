from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.exams.manage_focus_events_uc import (
    ClearAttemptFocusEventsUseCase,
    DeleteFocusEventUseCase,
)
from app.domain.entities.attempt import AttemptEntity
from app.domain.entities.exam import ExamEntity
from app.domain.value_objects import AttemptStatus, ExamAccessScope


@pytest.mark.asyncio
async def test_delete_focus_event_decrements_tab_out_count():
    exam_repo = AsyncMock()
    att_repo = AsyncMock()
    fe_repo = AsyncMock()

    exam_id = uuid4()
    attempt_id = uuid4()
    event_id = uuid4()
    user_id = 123

    exam = ExamEntity(
        id=exam_id,
        title="Test Exam",
        description="",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=1,
        is_published=True,
        created_by=user_id,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=True,
    )

    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=456,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now(),
        score=None,
        status=AttemptStatus.COMPLETED,
        tab_out_count=2,
        shuffle_seed=None,
        shuffle_snapshot=None,
    )

    exam_repo.get.return_value = exam
    att_repo.get.return_value = attempt
    fe_repo.delete.return_value = True

    use_case = DeleteFocusEventUseCase(exam_repo, att_repo, fe_repo)
    res = await use_case.execute(
        exam_id=exam_id,
        attempt_id=attempt_id,
        event_id=event_id,
        user_id=user_id,
        user_role="educator",
    )

    assert res["success"] is True
    assert res["tab_out_count"] == 1
    assert attempt.tab_out_count == 1
    att_repo.save.assert_awaited_once_with(attempt)
    fe_repo.delete.assert_awaited_once_with(event_id)


@pytest.mark.asyncio
async def test_clear_attempt_focus_events_resets_tab_out_count_to_zero():
    exam_repo = AsyncMock()
    att_repo = AsyncMock()
    fe_repo = AsyncMock()

    exam_id = uuid4()
    attempt_id = uuid4()
    user_id = 123

    exam = ExamEntity(
        id=exam_id,
        title="Test Exam",
        description="",
        start_time=None,
        end_time=None,
        duration_minutes=60,
        max_attempts=1,
        is_published=True,
        created_by=user_id,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=True,
    )

    attempt = AttemptEntity(
        id=attempt_id,
        exam_id=exam_id,
        user_id=456,
        started_at=datetime.now(),
        completed_at=None,
        expires_at=datetime.now(),
        score=None,
        status=AttemptStatus.COMPLETED,
        tab_out_count=5,
        shuffle_seed=None,
        shuffle_snapshot=None,
    )

    exam_repo.get.return_value = exam
    att_repo.get.return_value = attempt
    fe_repo.delete_for_attempt.return_value = 5

    use_case = ClearAttemptFocusEventsUseCase(exam_repo, att_repo, fe_repo)
    res = await use_case.execute(
        exam_id=exam_id,
        attempt_id=attempt_id,
        user_id=user_id,
        user_role="educator",
    )

    assert res["success"] is True
    assert res["tab_out_count"] == 0
    assert res["deleted_count"] == 5
    assert attempt.tab_out_count == 0
    att_repo.save.assert_awaited_once_with(attempt)
    fe_repo.delete_for_attempt.assert_awaited_once_with(attempt_id)
