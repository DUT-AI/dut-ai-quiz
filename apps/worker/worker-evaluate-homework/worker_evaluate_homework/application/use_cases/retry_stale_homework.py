from loguru import logger

from worker_evaluate_homework.domain import IHomeworkGradingRepository


class RetryStaleHomeworkUseCase:
    """Use case to scan and re-enqueue unready homeworks and non-graded submissions."""

    def __init__(
        self,
        repository: IHomeworkGradingRepository,
        queue_name: str,
        stale_homework_minutes: int = 10,
        stale_submission_minutes: int = 15,
        days_limit: int = 7,
        homework_batch_limit: int = 10,
        submission_batch_limit: int = 20,
    ) -> None:
        self._repository = repository
        self._queue_name = queue_name
        self._stale_homework_minutes = stale_homework_minutes
        self._stale_submission_minutes = stale_submission_minutes
        self._days_limit = days_limit
        self._homework_batch_limit = homework_batch_limit
        self._submission_batch_limit = submission_batch_limit

    async def execute(self, arq_redis) -> dict[str, int]:
        enqueued_homeworks = 0
        enqueued_submissions = 0

        # 1. Quét và enqueue các homework chưa READY (PENDING, FAILED do LLM, PROCESSING bị stale)
        try:
            homework_ids = await self._repository.list_stale_homework_ids(
                stale_minutes=self._stale_homework_minutes,
                days_limit=self._days_limit,
                limit=self._homework_batch_limit,
            )
            for hw_id in homework_ids:
                try:
                    job = await arq_redis.enqueue_job(
                        "register_homework_job",
                        homework_id=str(hw_id),
                        _queue_name=self._queue_name,
                        _job_id=f"homework-register:{hw_id}",
                        _defer_by=1,
                    )
                    enqueued_homeworks += int(job is not None)
                except Exception as exc:
                    logger.warning("Không thể enqueue retry cho homework {}: {}", hw_id, exc)
        except Exception as exc:
            logger.error("Lỗi khi truy vấn stale homeworks: {}", exc)

        # 2. Quét và enqueue các submission chưa GRADED (thuộc homework đã READY)
        try:
            submission_ids = await self._repository.list_stale_submission_ids(
                stale_minutes=self._stale_submission_minutes,
                days_limit=self._days_limit,
                limit=self._submission_batch_limit,
            )
            for sub_id in submission_ids:
                try:
                    job = await arq_redis.enqueue_job(
                        "evaluate_homework_job",
                        submission_id=str(sub_id),
                        _queue_name=self._queue_name,
                        _job_id=f"homework-evaluate:{sub_id}",
                        _defer_by=1,
                    )
                    enqueued_submissions += int(job is not None)
                except Exception as exc:
                    logger.warning("Không thể enqueue retry cho submission {}: {}", sub_id, exc)
        except Exception as exc:
            logger.error("Lỗi khi truy vấn stale submissions: {}", exc)

        if enqueued_homeworks > 0 or enqueued_submissions > 0:
            logger.info(
                "Cron retry sweep hoàn tất: {} homeworks, {} submissions đã được enqueue.",
                enqueued_homeworks,
                enqueued_submissions,
            )

        return {
            "homeworks_enqueued": enqueued_homeworks,
            "submissions_enqueued": enqueued_submissions,
        }
