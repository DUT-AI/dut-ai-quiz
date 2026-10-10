"""Preview or replay context failures after deploying the token-budget worker.

Run inside the rebuilt worker container. Defaults to read-only preview.
No public status, score, result, or existing queue entry is changed here.
"""

import argparse
import asyncio
from datetime import timedelta
from uuid import UUID

from app.config import settings
from app.core.datetime_utils import now_ict
from app.infrastructure.database import AsyncSessionLocal
from app.infrastructure.persistence.models.homework import Homework, HomeworkSubmission
from arq.connections import create_pool
from sqlalchemy import or_, select
from worker_evaluate_homework.presentation.arq_tasks import _redis_settings_from_config


async def replay(args):
    now = now_ict()
    expired = now - timedelta(seconds=settings.homework_grading_timeout_seconds + 60)
    stmt = (
        select(HomeworkSubmission)
        .join(Homework, Homework.id == HomeworkSubmission.homework_id)
        .where(
            Homework.archived_at.is_(None),
            Homework.grading_status == "READY",
            HomeworkSubmission.status.in_(["FAILED", "GRADING"]),
            HomeworkSubmission.submitted_at >= now - timedelta(days=args.days),
            or_(
                HomeworkSubmission.grading_error.ilike("%exceed_context_size_error%"),
                HomeworkSubmission.grading_error.ilike("%exceeds the available context size%"),
            ),
            or_(
                HomeworkSubmission.grading_started_at.is_(None),
                HomeworkSubmission.grading_started_at < expired,
            ),
        )
        .order_by(HomeworkSubmission.submitted_at.asc())
        .limit(args.limit)
    )
    if args.submission_id:
        stmt = stmt.where(HomeworkSubmission.id.in_(args.submission_id))
    redis = None
    try:
        if args.apply:
            redis = await create_pool(_redis_settings_from_config())
            if not await redis.get(f"{settings.homework_queue_name}:health-check"):
                raise RuntimeError("Worker chưa healthy; chưa reset metadata hoặc enqueue bài")
            stmt = stmt.with_for_update(of=HomeworkSubmission, skip_locked=True)
        async with AsyncSessionLocal() as session:
            rows = list((await session.scalars(stmt)).all())
            ids = [row.id for row in rows]
            for row in rows:
                print(
                    f"{'REPLAY' if args.apply else 'PREVIEW'} {row.id} attempts={row.grading_attempts}"
                )
                if args.apply:
                    row.grading_attempts = 0
                    row.grading_started_at = None
                    row.grading_retryable = True
            if args.apply:
                await session.commit()
        enqueued = 0
        if redis is not None:
            for submission_id in ids:
                job = await redis.enqueue_job(
                    "evaluate_homework_job",
                    submission_id=str(submission_id),
                    _queue_name=settings.homework_queue_name,
                    _job_id=f"homework-evaluate:{submission_id}",
                    _defer_by=1,
                )
                enqueued += int(job is not None)
        print(f"Selected={len(ids)} enqueued={enqueued} apply={args.apply}")
    finally:
        if redis is not None:
            await redis.aclose()


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--apply",
        action="store_true",
        help="Reset internal retry metadata and enqueue selected context failures",
    )
    parser.add_argument("--submission-id", action="append", type=UUID)
    parser.add_argument("--limit", type=int, default=20)
    parser.add_argument("--days", type=int, default=7)
    args = parser.parse_args()
    if not 1 <= args.limit <= 100 or not 1 <= args.days <= 90:
        parser.error("limit must be 1..100 and days must be 1..90")
    asyncio.run(replay(args))


if __name__ == "__main__":
    main()
