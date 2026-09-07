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
    ListCompletedHomeworkMembersUseCase,
    ListMyHomeworksUseCase,
    RetryHomeworkSubmissionUseCase,
    SubmitHomeworkUseCase,
    submit_homework_uc,
)
from app.application.use_cases.homeworks._shared import (
    HOMEWORK_ATTACHMENT_SUFFIXES,
    HOMEWORK_SUBMISSION_SUFFIXES,
    generate_download_url,
    upload_homework_file,
)
from app.config import Settings, settings
from app.core.datetime_utils import now_ict
from app.domain.entities.homework import (
    HomeworkEntity,
    HomeworkSubmissionEntity,
    HomeworkSubmissionStatus,
)
from app.domain.exceptions.exceptions import AppException


class HomeworkRepositoryStub:
    def __init__(self, homework: HomeworkEntity) -> None:
        self.homework = homework
        self.completed_user_ids: list[int] = []
        self.submission: HomeworkSubmissionEntity | None = None

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
        return self.submission

    async def get_submission(self, submission_id):
        if self.submission and self.submission.id == submission_id:
            return self.submission
        return None

    async def retry_failed_submission(self, submission_id):
        if (
            self.submission
            and self.submission.id == submission_id
            and self.submission.status == HomeworkSubmissionStatus.FAILED
        ):
            self.submission = replace(
                self.submission,
                status=HomeworkSubmissionStatus.GRADING,
                grading_error=None,
                score=None,
                is_pass=None,
            )
            return self.submission
        return None

    async def count_submitters(self, homework_id):
        return 0

    async def list_completed_user_ids(self, homework_id):
        return self.completed_user_ids

    async def list_completed_members_by_lesson(self, lesson_id):
        from app.application.dtos.homework import CompletedHomeworkMemberOutDTO

        return [
            CompletedHomeworkMemberOutDTO(
                user_id=uid,
                submission_count=2,
                max_score=9.5,
            )
            for uid in self.completed_user_ids
        ]


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
async def test_failed_submission_can_be_retried_without_new_attempt(
    homework: HomeworkEntity,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    repository.submission = HomeworkSubmissionEntity(
        id=uuid4(),
        homework_id=homework.id,
        user_id=99,
        object_key="homeworks/submission.zip",
        original_filename="submission.zip",
        submitted_at=now_ict(),
        is_late=False,
        attempt_number=2,
        status=HomeworkSubmissionStatus.FAILED,
        grading_error="429 quota exceeded",
        score=0,
        is_pass=False,
    )
    queue = AsyncMock()
    use_case = RetryHomeworkSubmissionUseCase(repository, queue)

    result = await use_case.execute(repository.submission.id, user_id=99)

    assert result.id == repository.submission.id
    assert result.attempt_number == 2
    assert result.status is HomeworkSubmissionStatus.GRADING
    assert result.grading_error is None
    queue.enqueue_evaluation.assert_awaited_once_with(result.id)


@pytest.mark.asyncio
async def test_submission_retry_is_limited_to_owner_and_failed_status(
    homework: HomeworkEntity,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    repository.submission = HomeworkSubmissionEntity(
        id=uuid4(),
        homework_id=homework.id,
        user_id=99,
        object_key="homeworks/submission.zip",
        original_filename="submission.zip",
        submitted_at=now_ict(),
        is_late=False,
        attempt_number=1,
        status=HomeworkSubmissionStatus.GRADED,
    )
    use_case = RetryHomeworkSubmissionUseCase(repository, AsyncMock())

    with pytest.raises(AppException) as owner_error:
        await use_case.execute(repository.submission.id, user_id=7)
    assert owner_error.value.status_code == 404

    with pytest.raises(AppException) as status_error:
        await use_case.execute(repository.submission.id, user_id=99)
    assert status_error.value.status_code == 409


@pytest.mark.asyncio
async def test_homework_files_are_zip_only_and_limit_is_20_mb() -> None:
    assert settings.homework_max_file_size_bytes == 20 * 1024 * 1024
    assert "homework_max_file_size_bytes" not in Settings.model_fields

    assert HOMEWORK_SUBMISSION_SUFFIXES == (
        ".zip",
        ".rar",
        ".7z",
        ".tar.gz",
        ".gz",
    )

    with pytest.raises(AppException, match=r"Chỉ chấp nhận file: \.zip"):
        await upload_homework_file(
            AsyncMock(),
            HomeworkFileDTO(filename="requirements.pdf", content=b"pdf"),
            prefix="homeworks/attachments",
            allowed_suffixes=HOMEWORK_ATTACHMENT_SUFFIXES,
        )


@pytest.mark.asyncio
async def test_completed_members_returns_manage_user_ids(
    homework: HomeworkEntity,
) -> None:
    from app.domain.entities.lesson import LessonEntity

    repository = HomeworkRepositoryStub(homework)
    repository.completed_user_ids = [7, 99]
    lesson_repo = AsyncMock()
    lesson = LessonEntity(
        id=homework.lesson_id,
        name="Lesson 1",
        slug="lesson-1",
        description="",
        order=1,
        created_at=now_ict(),
    )
    lesson_repo.get_by_slug.return_value = lesson
    use_case = ListCompletedHomeworkMembersUseCase(repository, lesson_repo)

    result = await use_case.execute("lesson-1")

    assert [member.user_id for member in result] == [7, 99]
    assert [member.submission_count for member in result] == [2, 2]
    assert [member.max_score for member in result] == [9.5, 9.5]


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


@pytest.mark.asyncio
async def test_submit_homework_with_presigned_object_key(
    homework: HomeworkEntity,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    queue = AsyncMock()
    use_case = SubmitHomeworkUseCase(repository, AsyncMock(), queue)

    result = await use_case.execute(
        SubmitHomeworkDTO(
            homework_id=homework.id,
            user_id=99,
            object_key=f"homeworks/{homework.id}/submissions/99/20260908_test.zip",
            original_filename="my_test.zip",
        )
    )

    assert result.user_id == 99
    assert result.original_filename == "my_test.zip"
    assert result.attempt_number == 1
    queue.enqueue_evaluation.assert_awaited_once_with(result.id)


@pytest.mark.asyncio
async def test_submit_homework_with_invalid_key_prefix_fails(
    homework: HomeworkEntity,
) -> None:
    repository = HomeworkRepositoryStub(homework)
    queue = AsyncMock()
    use_case = SubmitHomeworkUseCase(repository, AsyncMock(), queue)

    with pytest.raises(ValueError, match="không hợp lệ"):
        await use_case.execute(
            SubmitHomeworkDTO(
                homework_id=homework.id,
                user_id=99,
                object_key="homeworks/other-hw/submissions/100/hack.zip",
            )
        )


@pytest.mark.asyncio
async def test_presign_homework_submission_use_case(
    homework: HomeworkEntity,
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    from app.application.use_cases.homeworks import PresignHomeworkSubmissionUseCase
    from app.config import settings

    monkeypatch.setattr(settings, "s3_endpoint", "dut-ai-minio:9000")
    monkeypatch.setattr(settings, "s3_access_key", "key")
    monkeypatch.setattr(settings, "s3_secret_key", "secret")
    monkeypatch.setattr(settings, "s3_bucket_name", "test-bucket")

    repository = HomeworkRepositoryStub(homework)
    from unittest.mock import MagicMock
    storage = MagicMock()
    storage.generate_presigned_upload_url.return_value = "https://minio.dutai.site/presigned-put-url"

    use_case = PresignHomeworkSubmissionUseCase(repository, storage)
    res = await use_case.execute(
        homework_id=homework.id,
        user_id=99,
        filename="my_solution.zip",
        content_type="application/zip",
    )

    assert res["upload_url"] == "https://minio.dutai.site/presigned-put-url"
    assert res["original_filename"] == "my_solution.zip"
    assert res["object_key"].startswith(f"homeworks/{homework.id}/submissions/99/")

