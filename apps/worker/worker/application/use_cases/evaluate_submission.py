import os
import posixpath
import shutil
import tempfile
from datetime import datetime, timedelta
from urllib.parse import unquote, urlparse
from uuid import UUID

from loguru import logger

from app.domain.entities.submission import (
    HackathonSubmissionEntity,
    SubmissionStatus,
)
from worker.domain.interfaces.artifact_store import IArtifactStore
from worker.domain.interfaces.cancellation import ICancellationToken
from worker.domain.interfaces.evaluator import IEvaluator
from worker.domain.interfaces.event_publisher import ISubmissionEventPublisher
from worker.domain.interfaces.sandbox import ISandbox
from worker.domain.interfaces.submission_repository import ISubmissionRepository


class EvaluateSubmissionUseCase:
    def __init__(
        self,
        sandbox: ISandbox,
        evaluator: IEvaluator,
        artifact_store: IArtifactStore,
        submission_repo: ISubmissionRepository,
        cancellation: ICancellationToken,
        event_publisher: ISubmissionEventPublisher,
        sandbox_timeout_seconds: int,
        sandbox_mem_limit: str,
        sandbox_cpu_limit: int,
        log_max_lines: int,
        sandbox_workspace_root: str | None = None,
    ):
        self.sandbox = sandbox
        self.evaluator = evaluator
        self.artifact_store = artifact_store
        self.submission_repo = submission_repo
        self.cancellation = cancellation
        self.event_publisher = event_publisher
        self.sandbox_timeout_seconds = sandbox_timeout_seconds
        self.sandbox_mem_limit = sandbox_mem_limit
        self.sandbox_cpu_limit = sandbox_cpu_limit
        self.log_max_lines = log_max_lines
        self.sandbox_workspace_root = sandbox_workspace_root

    async def execute(
        self,
        submission_id: str,
    ) -> float | None:
        submission_uuid = UUID(str(submission_id))
        logger.info(f"Executing EvaluateSubmissionUseCase for {submission_uuid}...")

        submission = await self.submission_repo.get_submission(submission_uuid)
        if not submission:
            raise ValueError(f"Submission not found: {submission_uuid}")

        if submission.status == SubmissionStatus.PUBLISHED:
            logger.info(
                "Submission {} is already published; skipping duplicate job.",
                submission_uuid,
            )
            return submission.public_score

        if await self._is_cancelled(submission_uuid):
            await self._mark_cancelled(submission)
            return None

        try:
            return await self._run_pipeline(
                submission=submission,
            )
        except Exception as exc:
            logger.exception(f"Unhandled worker failure for {submission_uuid}: {exc}")
            latest = await self.submission_repo.get_submission(submission_uuid)
            if latest and latest.status != SubmissionStatus.CANCELLED:
                await self._mark_failed(
                    latest,
                    error_message=f"Worker Error: {exc}",
                    logs="",
                )
            return None

    async def sweep_stale_submissions(
        self,
        uploading_timeout_seconds: int,
        processing_timeout_seconds: int,
    ) -> int:
        now = datetime.now()
        stale_submissions = await self.submission_repo.list_stale_active_submissions(
            uploading_stale_before=now - timedelta(seconds=uploading_timeout_seconds),
            processing_stale_before=now - timedelta(
                seconds=processing_timeout_seconds
            ),
        )

        for submission in stale_submissions:
            await self._mark_failed(
                submission,
                error_message=(
                    f"Submission stuck in {submission.status.value} past timeout."
                ),
                logs="",
            )

        if stale_submissions:
            logger.warning(f"Marked {len(stale_submissions)} stale submissions failed.")
        return len(stale_submissions)

    async def recover_stale_extracting_submissions(
        self, stale_seconds: int
    ) -> int:
        now = datetime.now()
        stale_submissions = await self.submission_repo.list_stale_active_submissions(
            uploading_stale_before=now - timedelta(days=3650),
            processing_stale_before=now - timedelta(seconds=stale_seconds),
        )
        extracting = [
            submission
            for submission in stale_submissions
            if submission.status == SubmissionStatus.EXTRACTING
        ]

        for submission in extracting:
            # Claim the stale row before running it so the next cron pass does not
            # start the same recovery again.
            submission.updated_at = now
            await self.submission_repo.update_submission(submission)
            logger.warning(
                "Recovering stale extracting submission {}", submission.id
            )
            await self.execute(str(submission.id))

        return len(extracting)

    async def _run_pipeline(
        self,
        submission: HackathonSubmissionEntity,
    ) -> float | None:
        task = await self.submission_repo.get_task(submission.task_id)
        if not task:
            await self._mark_failed(
                submission,
                error_message=f"Task not found: {submission.task_id}",
                logs="",
            )
            return None

        submission = await self._transition(submission, SubmissionStatus.EXTRACTING)
        if submission.status == SubmissionStatus.CANCELLED:
            return None

        if self.sandbox_workspace_root:
            os.makedirs(self.sandbox_workspace_root, exist_ok=True)

        with tempfile.TemporaryDirectory(dir=self.sandbox_workspace_root) as tmpdir:
            sandbox_dir = os.path.join(tmpdir, "sandbox")
            private_dir = os.path.join(tmpdir, "private")
            os.makedirs(sandbox_dir, exist_ok=True)
            os.makedirs(private_dir, exist_ok=True)

            script_path = os.path.join(sandbox_dir, "predict.py")
            ground_truth_path = os.path.join(private_dir, "ground_truth.csv")
            prediction_path = os.path.join(sandbox_dir, "predict.csv")

            self.artifact_store.download_file(submission.script_url, script_path)
            self._download_model_if_present(submission, sandbox_dir)
            self._download_hidden_input_if_present(task.public_test_url, sandbox_dir)
            self.artifact_store.download_file(task.private_test_url, ground_truth_path)

            if await self._is_cancelled(submission.id):
                await self._mark_cancelled(submission)
                return None

            submission = await self._transition(submission, SubmissionStatus.RUNNING)
            if submission.status == SubmissionStatus.CANCELLED:
                return None

            sandbox_result = await self.sandbox.run_script(
                script_dir=sandbox_dir,
                script_name="predict.py",
                timeout_seconds=self.sandbox_timeout_seconds,
                mem_limit=self.sandbox_mem_limit,
                nano_cpus=self.sandbox_cpu_limit,
                submission_id=str(submission.id),
                cancel_check=lambda: self.cancellation.is_cancelled(submission.id),
            )

            if sandbox_result["status"] == "cancelled":
                await self._mark_cancelled(submission)
                return None

            if sandbox_result["status"] != "success":
                await self._mark_failed(
                    submission,
                    error_message=sandbox_result.get("error")
                    or "Sandbox execution failed.",
                    logs=self._tail_logs(sandbox_result.get("logs", "")),
                )
                return None

            if not os.path.exists(prediction_path):
                await self._mark_failed(
                    submission,
                    error_message="Sandbox completed but predict.csv was not created.",
                    logs=self._tail_logs(sandbox_result.get("logs", "")),
                )
                return None

            if await self._is_cancelled(submission.id):
                await self._mark_cancelled(submission)
                return None

            submission = await self._transition(submission, SubmissionStatus.EVALUATING)
            if submission.status == SubmissionStatus.CANCELLED:
                return None

            try:
                score = self.evaluator.evaluate(
                    ground_truth_path,
                    prediction_path,
                    getattr(task.metric_type, "value", str(task.metric_type)),
                )
            except Exception as exc:
                await self._mark_failed(
                    submission,
                    error_message=f"Evaluation Error: {exc}",
                    logs=self._tail_logs(sandbox_result.get("logs", "")),
                )
                return None

            predict_key = self._predict_key(submission.script_url)
            self.artifact_store.upload_file(
                prediction_path, predict_key, content_type="text/csv"
            )

            submission.public_score = score
            submission.private_score = score
            submission.status = SubmissionStatus.PUBLISHED
            submission.error_message = None
            submission.logs = None
            submission.updated_at = datetime.now()
            submission = await self.submission_repo.update_submission(submission)
            await self.event_publisher.publish_submission_update(
                submission, "submission.published"
            )

            logger.info(f"Successfully calculated score for {submission.id}: {score}")
            return score

    def _download_model_if_present(
        self, submission: HackathonSubmissionEntity, sandbox_dir: str
    ) -> None:
        if not submission.model_url:
            return

        model_name = self._safe_filename(submission.model_url, default="model.bin")
        model_path = os.path.join(sandbox_dir, model_name)
        self.artifact_store.download_file(submission.model_url, model_path)

    def _download_hidden_input_if_present(
        self, public_test_url: str | None, sandbox_dir: str
    ) -> None:
        if not public_test_url:
            return

        hidden_path = os.path.join(sandbox_dir, "hidden_test_input.csv")
        self.artifact_store.download_file(public_test_url, hidden_path)

        original_name = self._safe_filename(public_test_url, default="")
        if original_name and original_name != "hidden_test_input.csv":
            shutil.copyfile(hidden_path, os.path.join(sandbox_dir, original_name))

    async def _transition(
        self,
        submission: HackathonSubmissionEntity,
        status: SubmissionStatus,
    ) -> HackathonSubmissionEntity:
        if await self._is_cancelled(submission.id):
            return await self._mark_cancelled(submission)

        submission.status = status
        submission.updated_at = datetime.now()
        submission = await self.submission_repo.update_submission(submission)
        await self.event_publisher.publish_submission_update(
            submission, f"submission.{status.value.lower()}"
        )
        return submission

    async def _mark_failed(
        self,
        submission: HackathonSubmissionEntity,
        error_message: str,
        logs: str,
    ) -> HackathonSubmissionEntity:
        if await self._is_cancelled(submission.id):
            return await self._mark_cancelled(submission)

        submission.status = SubmissionStatus.FAILED
        submission.public_score = None
        submission.private_score = None
        submission.error_message = error_message
        submission.logs = self._tail_logs(logs)
        submission.updated_at = datetime.now()
        submission = await self.submission_repo.update_submission(submission)
        await self.event_publisher.publish_submission_update(
            submission, "submission.failed"
        )
        return submission

    async def _mark_cancelled(
        self, submission: HackathonSubmissionEntity
    ) -> HackathonSubmissionEntity:
        submission.status = SubmissionStatus.CANCELLED
        submission.updated_at = datetime.now()
        submission = await self.submission_repo.update_submission(submission)
        await self.event_publisher.publish_submission_update(
            submission, "submission.cancelled"
        )
        return submission

    async def _is_cancelled(self, submission_id: UUID) -> bool:
        if await self.cancellation.is_cancelled(submission_id):
            return True

        latest = await self.submission_repo.get_submission(submission_id)
        return latest is not None and latest.status == SubmissionStatus.CANCELLED

    def _tail_logs(self, logs: str) -> str:
        if not logs:
            return ""
        return "\n".join(logs.splitlines()[-self.log_max_lines :])

    def _predict_key(self, script_reference: str) -> str:
        script_key = self.artifact_store.object_key_from_reference(script_reference)
        return posixpath.join(posixpath.dirname(script_key), "predict.csv")

    def _safe_filename(self, key_or_url: str, default: str) -> str:
        parsed = urlparse(key_or_url)
        path = parsed.path if parsed.scheme else key_or_url
        filename = os.path.basename(unquote(path.rstrip("/")))
        return filename or default
