import asyncio
from uuid import UUID

from worker_evaluate_homework.application.retry import RetryGradingRequested
from worker_evaluate_homework.domain import (
    HomeworkRubric,
    IHomeworkArtifactReader,
    IHomeworkGradingEngine,
    IHomeworkGradingRepository,
    SubmissionGradingStatus,
)
from worker_evaluate_homework.domain.errors import LLMError, is_retryable_error
from worker_evaluate_homework.domain.fingerprints import (
    build_fingerprint,
    find_plagiarism,
)
from worker_evaluate_homework.domain.retry import GradingRetryPolicy

from .register_homework import RegisterHomeworkUseCase


class EvaluateHomeworkSubmissionUseCase:
    def __init__(
        self,
        repository: IHomeworkGradingRepository,
        artifact_reader: IHomeworkArtifactReader,
        grading_engine: IHomeworkGradingEngine,
        register_homework: RegisterHomeworkUseCase,
        plagiarism_threshold: float,
        retry_policy: GradingRetryPolicy,
    ) -> None:
        self._repository = repository
        self._artifact_reader = artifact_reader
        self._grading_engine = grading_engine
        self._register_homework = register_homework
        self._plagiarism_threshold = plagiarism_threshold
        self._retry_policy = retry_policy

    async def execute(
        self,
        submission_id: UUID,
    ) -> float | None:
        submission = await self._repository.get_submission(submission_id)
        if submission is None:
            raise ValueError(f"Submission {submission_id} not found")
        if submission.status == SubmissionGradingStatus.GRADED.value:
            return submission.score

        attempt = await self._repository.claim_submission(submission_id)
        if attempt is None:
            return None
        try:
            homework = await self._repository.get_homework(submission.homework_id)
            if homework is None:
                raise ValueError(f"Homework {submission.homework_id} not found")
            if homework.grading_rubric is None or not homework.grading_rubric.get("criteria"):
                await self._register_homework.execute(homework.id)
                homework = await self._repository.get_homework(homework.id)
                if (
                    homework is None
                    or homework.grading_rubric is None
                    or not homework.grading_rubric.get("criteria")
                ):
                    raise LLMError("Rubric chưa sẵn sàng để chấm bài", retryable=True)

            sources = await self._artifact_reader.read_submission_sources(submission.object_key)
            fingerprints = [build_fingerprint(source) for source in sources]
            previous = await self._repository.list_previous_fingerprints(
                submission.homework_id,
                submission.user_id,
                [value["file_name"] for value in fingerprints],
            )
            plagiarism, similarity, copied_user_id = find_plagiarism(
                fingerprints,
                previous,
            )
            result = await self._grading_engine.grade(
                HomeworkRubric.model_validate(homework.grading_rubric),
                sources,
            )
            copied_user_id = copied_user_id if similarity >= self._plagiarism_threshold else None
            saved = await self._repository.save_submission_result(
                submission_id,
                result,
                plagiarism,
                copied_user_id,
                attempt=attempt,
                fingerprints=fingerprints,
            )
            return result.score if saved else None
        except asyncio.CancelledError:
            should_retry = self._retry_policy.can_retry(attempt, retryable=True)
            await self._repository.save_submission_error(
                submission_id,
                "Worker grading timeout hoặc bị dừng",
                attempt=attempt,
                final=not should_retry,
                retryable=should_retry,
            )
            raise
        except Exception as exc:
            # Registration can request its own retry. The submission still has to
            # apply its independent persisted limit before requesting another job.
            failure = (
                exc.__cause__
                if isinstance(exc, RetryGradingRequested) and isinstance(exc.__cause__, Exception)
                else exc
            )
            should_retry = self._retry_policy.can_retry(
                attempt, retryable=is_retryable_error(failure)
            )
            saved = await self._repository.save_submission_error(
                submission_id,
                str(failure),
                attempt=attempt,
                final=not should_retry,
                retryable=should_retry,
            )
            if not saved:
                return None
            if should_retry:
                raise RetryGradingRequested(self._retry_policy.delay_seconds(attempt)) from failure
            if failure is not exc:
                raise failure from None
            raise
