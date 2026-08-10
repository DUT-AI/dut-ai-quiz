from dataclasses import replace
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from app.application.dtos.homework import (
    HomeworkFileDTO,
    HomeworkSubmissionOutDTO,
    SubmitHomeworkDTO,
)
from app.application.use_cases.homeworks import (
    ListMyHomeworksUseCase,
    SubmitHomeworkUseCase,
    submit_homework_uc,
)
from app.application.use_cases.homeworks._shared import generate_download_url
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)


class HomeworkRepositoryStub:
    def __init__(self, homework: HomeworkEntity) -> None:
        self.homework = homework

    async def get_homework(self, homework_id):
        if homework_id == self.homework.id:
            return self.homework
        return None

    async def create_submission(self, submission):
        return replace(submission, id=uuid4(), attempt_number=1)

    async def list_homeworks(self, lesson_id=None):
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
        created_by=1,
        created_at=current_time,
        updated_at=current_time,
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


@pytest.mark.asyncio
async def test_external_legacy_download_url_does_not_use_current_s3_bucket() -> None:
    storage = AsyncMock()
    url = "https://legacy.example/homework/submission.zip"

    assert await generate_download_url(storage, url) == url
    storage.generate_presigned_download_url.assert_not_called()


def test_student_submission_response_hides_plagiarism_identity() -> None:
    current_time = now_ict()
    submission = HomeworkSubmissionEntity(
        id=uuid4(),
        homework_id=uuid4(),
        user_id=99,
        object_key="homeworks/submission.zip",
        original_filename="submission.zip",
        submitted_at=current_time,
        is_late=False,
        attempt_number=1,
        status=HomeworkSubmissionStatus.GRADED,
        is_plagiarized=True,
        plagiarism_info=[
            {
                "main.py": {
                    "best_user_id_match": "7",
                    "score": {"similarity_score": 0.95},
                }
            }
        ],
        plagiarized_from_user_id=7,
    )

    student_result = HomeworkSubmissionOutDTO.from_entity(submission)
    manager_result = HomeworkSubmissionOutDTO.from_entity(
        submission,
        include_plagiarism_identity=True,
    )

    assert student_result.is_plagiarized is True
    assert student_result.plagiarism_info is None
    assert student_result.plagiarized_from_user_id is None
    assert manager_result.plagiarism_info == submission.plagiarism_info
    assert manager_result.plagiarized_from_user_id == 7
