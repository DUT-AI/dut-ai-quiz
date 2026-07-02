from app.config import settings
from arq.connections import RedisSettings
from loguru import logger

from worker.application.use_cases.evaluate_submission import EvaluateSubmissionUseCase
from worker.infrastructure.adapters.csv_evaluator import CsvEvaluator
from worker.infrastructure.adapters.docker_sandbox import DockerSandbox


async def startup(ctx):
    logger.info("Starting up worker entrypoint (Presentation layer)...")
    # Wire dependencies
    sandbox = DockerSandbox()
    evaluator = CsvEvaluator()
    ctx["evaluate_use_case"] = EvaluateSubmissionUseCase(sandbox, evaluator)
    logger.info("Clean Architecture components successfully initialized.")


async def shutdown(ctx):
    logger.info("Shutting down worker entrypoint...")


async def evaluate_submission_job(
    ctx,
    submission_id: str,
    script_s3_key: str,
    ground_truth_s3_key: str,
    metric_type: str,
):
    logger.info(f"Received submission job event for ID: {submission_id}")
    use_case: EvaluateSubmissionUseCase = ctx["evaluate_use_case"]

    try:
        score = await use_case.execute(
            submission_id=submission_id,
            script_s3_key=script_s3_key,
            ground_truth_s3_key=ground_truth_s3_key,
            metric_type=metric_type,
        )
        logger.info(
            f"Job completed successfully. Submission {submission_id} scored: {score}"
        )
        return score
    except Exception as e:
        logger.error(f"Job failed for Submission {submission_id}: {e}")
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
