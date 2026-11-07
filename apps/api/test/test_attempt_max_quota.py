from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.use_cases.attempts.start_attempt_use_case import (
    StartAttemptUseCase,
)
from app.domain.entities.exam import ExamEntity
from app.domain.exceptions.exceptions import MaxAttemptsReachedException
from app.domain.value_objects import ExamAccessScope


@pytest.mark.asyncio
async def test_start_attempt_raises_max_attempts_reached():
    exam_repo = AsyncMock()
    eq_repo = AsyncMock()
    att_repo = AsyncMock()

    exam_id = uuid4()
    user_id = 456

    exam = ExamEntity(
        id=exam_id,
        title="Max Attempt Exam",
        description="Desc",
        start_time=None,
        end_time=None,
        duration_minutes=30,
        max_attempts=2,
        is_published=True,
        created_by=1,
        participant_ids=[],
        access_scope=ExamAccessScope.PUBLIC,
        show_answers=False,
    )

    exam_repo.get.return_value = exam
    att_repo.get_active_for_user_exam.return_value = None
    # User already has 2 completed attempts
    att_repo.count_completed_for_user_exam.return_value = 2

    use_case = StartAttemptUseCase(exam_repo, eq_repo, att_repo)

    with pytest.raises(MaxAttemptsReachedException):
        await use_case.execute(exam_id, user_id)
