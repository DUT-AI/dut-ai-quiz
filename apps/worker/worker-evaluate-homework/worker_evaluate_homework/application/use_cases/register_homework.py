import asyncio
from uuid import UUID

from worker_evaluate_homework.application.retry import RetryGradingRequested
from worker_evaluate_homework.domain import (
    IHomeworkArtifactReader,
    IHomeworkGradingEngine,
    IHomeworkGradingRepository,
)
from worker_evaluate_homework.domain.errors import is_retryable_error
from worker_evaluate_homework.domain.retry import GradingRetryPolicy


class RegisterHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkGradingRepository,
        artifact_reader: IHomeworkArtifactReader,
        grading_engine: IHomeworkGradingEngine,
        retry_policy: GradingRetryPolicy,
    ) -> None:
        self._repository = repository
        self._artifact_reader = artifact_reader
        self._grading_engine = grading_engine
        self._retry_policy = retry_policy

    async def execute(self, homework_id: UUID) -> None:
        homework = await self._repository.get_homework(homework_id)
        if homework is None:
            raise ValueError(f"Homework {homework_id} not found")
        attempt = await self._repository.claim_homework(homework_id)
        if attempt is None:
            return
        try:
            attachment_text = await self._artifact_reader.read_homework_text(
                homework.attachment_key
            )
            rubric = await self._grading_engine.create_rubric(
                homework,
                attachment_text,
            )
            await self._repository.save_homework_rubric(
                homework_id,
                rubric.model_dump(mode="json"),
                attempt=attempt,
            )
        except asyncio.CancelledError:
            await self._repository.save_homework_error(
                homework_id,
                "Worker rubric timeout hoặc bị dừng",
                attempt=attempt,
                retryable=self._retry_policy.can_retry(attempt, retryable=True),
            )
            raise
        except Exception as exc:
            should_retry = self._retry_policy.can_retry(attempt, retryable=is_retryable_error(exc))
            saved = await self._repository.save_homework_error(
                homework_id,
                str(exc),
                attempt=attempt,
                retryable=should_retry,
            )
            if not saved:
                return
            if should_retry:
                raise RetryGradingRequested(self._retry_policy.delay_seconds(attempt)) from exc
            raise
