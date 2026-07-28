from dataclasses import replace
from datetime import timedelta
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest

from app.application.dtos.homework import HomeworkFileDTO, SubmitHomeworkDTO
from app.application.use_cases.homeworks import (
    ListMyHomeworksUseCase,
    SubmitHomeworkUseCase,
)
from app.application.use_cases.homeworks import submit_homework_uc
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import HomeworkEntity


class HomeworkRepositoryStub:
    def __init__(self, homework: HomeworkEntity) -> None:
        self.homework = homework
        self.list_user_id: int | None = -1

    async def get_homework(self, homework_id):
        if homework_id == self.homework.id:
            return self.homework
        return None

    async def create_submission(self, submission):
        return replace(submission, id=uuid4(), attempt_number=1)

    async def list_homeworks(self, user_id=None, lesson_id=None):
        self.list_user_id = user_id
        if lesson_id is not None and lesson_id != self.homework.lesson_id:
            return []
        return [self.homework]

    async def get_latest_submission(self, homework_id, user_id):
        return None

    async def count_submitters(self, homework_id):
        return 0


@pytest.fixture
def homework() -> HomeworkEntity:
    current_time = now_ict()
    return HomeworkEntity(
        id=uuid4(),
        lesson_id=uuid4(),
        title="Homework",
        description="",
        deadline=current_time + timedelta(days=1),
        created_by=1,
        created_at=current_time,
        updated_at=current_time,
        assignee_ids=[10],
    )


@pytest.mark.asyncio
async def test_unassigned_authenticated_user_can_submit(
    homework: HomeworkEntity,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    upload = AsyncMock(return_value="homeworks/submission.zip")
    monkeypatch.setattr(submit_homework_uc, "upload_homework_file", upload)
    queue = AsyncMock()
    use_case = SubmitHomeworkUseCase(repository, AsyncMock(), queue)

    result = await use_case.execute(
        SubmitHomeworkDTO(
            homework_id=homework.id,
            user_id=99,
            file=HomeworkFileDTO(
                filename="submission.zip",
                content=b"archive",
            ),
        )
    )

    assert result.user_id == 99
    assert result.attempt_number == 1
    queue.enqueue_evaluation.assert_awaited_once_with(result.id)


@pytest.mark.asyncio
async def test_my_homeworks_lists_all_lesson_homework(
    homework: HomeworkEntity,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    use_case = ListMyHomeworksUseCase(repository)

    result = await use_case.execute(99, lesson_id=homework.lesson_id)

    assert [item.id for item in result] == [homework.id]
    assert repository.list_user_id is None
