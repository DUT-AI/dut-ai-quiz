import asyncio
from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import httpx
import pytest
from arq import Retry
from worker_evaluate_homework.application.use_cases import (
    EvaluateHomeworkSubmissionUseCase,
    RegisterHomeworkUseCase,
    RetryStaleHomeworkUseCase,
)
from worker_evaluate_homework.domain import (
    GradeResult,
    GradingCriterion,
    HomeworkGradingRecord,
    HomeworkRubric,
    SourceFile,
    SubmissionGradingRecord,
)
from worker_evaluate_homework.domain.errors import ArtifactStorageError, ContextLimitError, LLMError
from worker_evaluate_homework.domain.retry import GradingAttempt
from worker_evaluate_homework.infrastructure.archive_reader import S3HomeworkArtifactReader
from worker_evaluate_homework.presentation.arq_tasks import (
    evaluate_homework_job,
    register_homework_job,
)


@pytest.fixture
def grading(retry_policy):
    repo, reader, engine = AsyncMock(), AsyncMock(), AsyncMock()
    homework_id, submission_id = uuid4(), uuid4()
    rubric = HomeworkRubric(
        topic="Print",
        criteria=[
            GradingCriterion(id="print_output", criterion="Print", description="Print", weight=10)
        ],
    )
    repo.get_homework.return_value = HomeworkGradingRecord(
        homework_id, "Print", "Print", None, rubric.model_dump()
    )
    repo.get_submission.return_value = SubmissionGradingRecord(
        submission_id, homework_id, 1, "file.zip", "UPLOADED", None
    )
    attempt = GradingAttempt(1, datetime(2026, 10, 11))
    repo.claim_submission.return_value = repo.claim_homework.return_value = attempt
    repo.save_submission_error.return_value = repo.save_submission_result.return_value = True
    repo.save_homework_error.return_value = repo.save_homework_rubric.return_value = True
    repo.list_previous_fingerprints.return_value = []
    reader.read_submission_sources.return_value = [SourceFile("main.py", "print(42)")]
    engine.grade.return_value = GradeResult(True, 10, "Good", [])
    engine.create_rubric.return_value = rubric
    register = RegisterHomeworkUseCase(repo, reader, engine, retry_policy)
    evaluate = EvaluateHomeworkSubmissionUseCase(repo, reader, engine, register, 0.8, retry_policy)
    return repo, reader, engine, register, evaluate, submission_id, homework_id


@pytest.mark.asyncio
@pytest.mark.parametrize("number", [1, 2, 3])
async def test_submission_retry_and_final_failure_use_persisted_attempt(grading, number):
    repo, reader, _, _, evaluate, submission_id, _ = grading
    attempt = GradingAttempt(number, datetime(2026, 10, 11))
    repo.claim_submission.return_value = attempt
    error = LLMError("Temporary 503", retryable=True)
    reader.read_submission_sources.side_effect = error
    # A cron job starts at job_try=1 even after earlier database attempts.
    expected = Retry if number < 3 else LLMError
    with pytest.raises(expected) as failure:
        await evaluate_homework_job(
            {"evaluate_use_case": evaluate, "job_try": 1}, str(submission_id)
        )
    if number < 3:
        assert failure.value.defer_score == number * 10000
    else:
        assert failure.value is error
    kwargs = repo.save_submission_error.call_args.kwargs
    assert kwargs == {"attempt": attempt, "final": number == 3, "retryable": number < 3}


@pytest.mark.asyncio
@pytest.mark.parametrize("number", [1, 3])
async def test_registration_uses_the_same_retry_limit(grading, number):
    repo, reader, _, register, _, _, homework_id = grading
    attempt = GradingAttempt(number, datetime(2026, 10, 11))
    repo.claim_homework.return_value = attempt
    reader.read_homework_text.side_effect = LLMError("Temporary 429", retryable=True)
    with pytest.raises(Retry if number < 3 else LLMError):
        await register_homework_job({"register_use_case": register, "job_try": 1}, str(homework_id))
    assert repo.save_homework_error.call_args.kwargs == {
        "attempt": attempt,
        "retryable": number < 3,
    }


@pytest.mark.asyncio
async def test_permanent_error_is_final_on_first_attempt(grading):
    repo, reader, _, _, evaluate, submission_id, _ = grading
    reader.read_submission_sources.side_effect = ContextLimitError("Too long")
    with pytest.raises(ContextLimitError):
        await evaluate.execute(submission_id)
    assert repo.save_submission_error.call_args.kwargs["final"] is True
    assert repo.save_submission_error.call_args.kwargs["retryable"] is False


@pytest.mark.asyncio
@pytest.mark.parametrize("registration", [False, True])
async def test_read_failure_before_claim_does_not_write_failure(grading, registration):
    repo, _, _, register, evaluate, submission_id, homework_id = grading
    read = repo.get_homework if registration else repo.get_submission
    read.side_effect = RuntimeError("Database unavailable")
    with pytest.raises(RuntimeError, match="Database unavailable"):
        await (register.execute(homework_id) if registration else evaluate.execute(submission_id))
    repo.save_homework_error.assert_not_awaited()
    repo.save_submission_error.assert_not_awaited()


@pytest.mark.asyncio
async def test_claim_failure_does_not_modify_another_workers_attempt(grading):
    repo, _, _, _, evaluate, submission_id, _ = grading
    repo.claim_submission.side_effect = RuntimeError("Claim unavailable")
    with pytest.raises(RuntimeError, match="Claim unavailable"):
        await evaluate.execute(submission_id)
    repo.save_submission_error.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize("registration", [False, True])
async def test_unclaimed_job_does_not_grade_or_write(grading, registration):
    repo, reader, engine, register, evaluate, submission_id, homework_id = grading
    claim = repo.claim_homework if registration else repo.claim_submission
    claim.return_value = None
    await (register.execute(homework_id) if registration else evaluate.execute(submission_id))
    reader.read_homework_text.assert_not_awaited()
    reader.read_submission_sources.assert_not_awaited()
    engine.grade.assert_not_awaited()
    repo.save_homework_error.assert_not_awaited()
    repo.save_submission_error.assert_not_awaited()


@pytest.mark.asyncio
async def test_lost_claim_does_not_report_an_unsaved_score(grading):
    repo, _, _, _, evaluate, submission_id, _ = grading
    repo.save_submission_result.return_value = False
    assert await evaluate.execute(submission_id) is None
    repo.save_submission_error.assert_not_awaited()


@pytest.mark.asyncio
@pytest.mark.parametrize("registration", [False, True])
async def test_lost_claim_does_not_schedule_retry(grading, registration):
    repo, reader, _, register, evaluate, submission_id, homework_id = grading
    repo.save_submission_error.return_value = repo.save_homework_error.return_value = False
    read = reader.read_homework_text if registration else reader.read_submission_sources
    read.side_effect = LLMError("Temporary 503", retryable=True)
    assert (
        await (register.execute(homework_id) if registration else evaluate.execute(submission_id))
        is None
    )


@pytest.mark.asyncio
@pytest.mark.parametrize("registration", [False, True])
async def test_last_attempt_cancellation_is_final_and_propagates(grading, registration):
    repo, reader, _, register, evaluate, submission_id, homework_id = grading
    repo.claim_homework.return_value = repo.claim_submission.return_value = GradingAttempt(
        3, datetime(2026, 10, 11)
    )
    read = reader.read_homework_text if registration else reader.read_submission_sources
    read.side_effect = asyncio.CancelledError
    with pytest.raises(asyncio.CancelledError):
        await (register.execute(homework_id) if registration else evaluate.execute(submission_id))
    save = repo.save_homework_error if registration else repo.save_submission_error
    assert save.call_args.kwargs["retryable"] is False
    if not registration:
        assert save.call_args.kwargs["final"] is True


@pytest.mark.asyncio
async def test_nested_rubric_retry_respects_submission_attempt_limit(grading):
    repo, reader, _, _, evaluate, submission_id, _ = grading
    homework = repo.get_homework.return_value
    repo.get_homework.return_value = HomeworkGradingRecord(
        homework.id, homework.title, homework.description, None, None
    )
    repo.claim_submission.return_value = GradingAttempt(3, datetime(2026, 10, 11))
    reader.read_homework_text.side_effect = LLMError("Temporary 503", retryable=True)
    # The nested request must not escape the final submission attempt as an ARQ retry.
    with pytest.raises(LLMError):
        await evaluate_homework_job({"evaluate_use_case": evaluate}, str(submission_id))
    assert repo.save_submission_error.call_args.kwargs["final"] is True


@pytest.mark.asyncio
@pytest.mark.parametrize("status,retryable", [(404, False), (408, True), (429, True), (503, True)])
async def test_storage_adapter_translates_http_errors(status, retryable):
    async with httpx.AsyncClient(
        transport=httpx.MockTransport(lambda request: httpx.Response(status))
    ) as http:
        reader = S3HomeworkArtifactReader(http, AsyncMock())
        with pytest.raises(ArtifactStorageError) as failure:
            await reader.read_submission_sources("https://example.test/file.zip")
    assert failure.value.retryable is retryable


@pytest.mark.asyncio
async def test_storage_connection_failure_is_retryable():
    def unavailable(request):
        raise httpx.ConnectError("Unavailable", request=request)

    async with httpx.AsyncClient(transport=httpx.MockTransport(unavailable)) as http:
        with pytest.raises(ArtifactStorageError) as failure:
            await S3HomeworkArtifactReader(http, AsyncMock()).read_submission_sources(
                "https://example.test/file.zip"
            )
    assert failure.value.retryable is True


@pytest.mark.asyncio
async def test_cron_continues_after_individual_enqueue_failure():
    repo, queue = AsyncMock(), AsyncMock()
    first, second, submission_id = uuid4(), uuid4(), uuid4()
    repo.list_stale_homework_ids.return_value = [first, second]
    repo.list_stale_submission_ids.return_value = [submission_id]
    queue.enqueue_registration.side_effect = [RuntimeError("Queue unavailable"), True]
    queue.enqueue_evaluation.return_value = True
    assert await RetryStaleHomeworkUseCase(repo, queue).execute() == {
        "homeworks_enqueued": 1,
        "submissions_enqueued": 1,
    }
    queue.enqueue_registration.assert_any_await(second)
    queue.enqueue_evaluation.assert_awaited_once_with(submission_id)
