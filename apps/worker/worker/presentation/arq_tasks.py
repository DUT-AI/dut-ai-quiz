from uuid import UUID

from app.application.use_cases.submissions import UpdateSubmissionStatusUseCase
from app.config import settings
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.repositories.submissions import HackathonSubmissionRepository
from arq.connections import RedisSettings
from loguru import logger

from worker.application.use_cases.evaluate_submission import EvaluateSubmissionUseCase
from worker.infrastructure.adapters.gpu_evaluator import GpuEvaluator
from worker.infrastructure.adapters.secure_sandbox import SecureSandbox


async def startup(ctx):
    logger.info("Starting up worker entrypoint (Presentation layer)...")
    sandbox = SecureSandbox(
        default_timeout=settings.sandbox_timeout_seconds,
        default_memory_mb=settings.sandbox_memory_mb,
        default_cpu_limit=settings.sandbox_cpu_limit,
        default_pids_limit=settings.sandbox_pids_limit,
        log_max_lines=settings.sandbox_log_max_lines,
    )
    evaluator = GpuEvaluator()
    ctx["evaluate_use_case"] = EvaluateSubmissionUseCase(sandbox, evaluator)
    logger.info("Clean Architecture components successfully initialized.")


async def shutdown(ctx):
    logger.info("Shutting down worker entrypoint...")


async def _update_submission_running(submission_id: str) -> None:
    async with AsyncSessionLocal() as session:
        repo = HackathonSubmissionRepository(session)
        use_case = UpdateSubmissionStatusUseCase(repo)
        await use_case.execute_running(UUID(submission_id))
        await session.commit()


async def _update_submission_completed(submission_id: str, score: float) -> None:
    async with AsyncSessionLocal() as session:
        repo = HackathonSubmissionRepository(session)
        use_case = UpdateSubmissionStatusUseCase(repo)
        await use_case.execute_completed(
            UUID(submission_id),
            score,
            "Evaluation completed successfully.",
        )
        await session.commit()


async def _update_submission_failed(submission_id: str, exc: Exception) -> None:
    async with AsyncSessionLocal() as session:
        repo = HackathonSubmissionRepository(session)
        use_case = UpdateSubmissionStatusUseCase(repo)
        error = str(exc)
        if "timeout" in error.lower():
            await use_case.execute_timeout(UUID(submission_id), error)
        else:
            await use_case.execute_failed(UUID(submission_id), error)
        await session.commit()


async def evaluate_submission_job(
    ctx,
    submission_id: str,
    script_s3_key: str,
    ground_truth_s3_key: str,
    metric_type: str,
    runtime_profile_id: str,
):
    logger.info(f"Received submission job event for ID: {submission_id}")
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]

    try:
        await _update_submission_running(submission_id)
        score = await use_case.execute(
            submission_id=submission_id,
            script_s3_key=script_s3_key,
            ground_truth_s3_key=ground_truth_s3_key,
            metric_type=metric_type,
            runtime_profile_id=runtime_profile_id,
        )
        await _update_submission_completed(submission_id, score)
        logger.info(
            f"Job completed successfully. Submission {submission_id} scored: {score}"
        )
        return score
    except Exception as e:
        logger.error(f"Job failed for Submission {submission_id}: {e}")
        try:
            await _update_submission_failed(submission_id, e)
        except Exception as update_exc:
            logger.error(
                "Failed to persist failure status for "
                f"Submission {submission_id}: {update_exc}"
            )
        raise


# Parse Redis Settings
redis_url = settings.redis_host
host = redis_url
port = settings.redis_port

if "://" in redis_url:
    parts = redis_url.split("://")[1].split("/")[0]
    if ":" in parts:
        host, port = parts.split(":")
        port = int(port)
    else:
        host = parts
        port = settings.redis_port


class WorkerSettings:
    functions = [evaluate_submission_job]
    redis_settings = RedisSettings(host=host, port=port)
    on_startup = startup
    on_shutdown = shutdown
