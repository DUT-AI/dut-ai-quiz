"""
API Router for Hackathon Submission management
"""
import inspect
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from loguru import logger
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.use_cases.submissions import (
    CreateSubmissionUseCase,
    GetBestSubmissionUseCase,
    GetSubmissionUseCase,
    ListSubmissionsUseCase,
)
from app.config import settings
from app.infrastructure.database import get_session
from app.infrastructure.repositories.hackathons import HackathonTaskRepository
from app.infrastructure.repositories.runtime_profiles import RuntimeProfileRepository
from app.infrastructure.repositories.submissions import HackathonSubmissionRepository
from app.presentation.api.dependencies import get_current_user
from app.presentation.schemas.submissions import (
    SubmissionCreate,
    SubmissionListResponse,
    SubmissionResponse,
)

router = APIRouter(prefix="/submissions", tags=["Submissions"])


def _redis_settings() -> tuple[str, int]:
    redis_url_or_host = settings.redis_host
    host = redis_url_or_host
    port = settings.redis_port

    if "://" in redis_url_or_host:
        host_part = redis_url_or_host.split("://", 1)[1].split("/", 1)[0]
        if ":" in host_part:
            host, port_text = host_part.rsplit(":", 1)
            port = int(port_text)
        else:
            host = host_part

    return host, port


async def _close_pool(pool) -> None:
    close = getattr(pool, "aclose", None) or getattr(pool, "close", None)
    if not close:
        return

    result = close()
    if inspect.isawaitable(result):
        await result


async def _enqueue_submission_job(submission, task) -> str | None:
    try:
        from arq import create_pool
        from arq.connections import RedisSettings
    except ImportError as exc:
        logger.warning(
            f"Cannot enqueue submission job because arq is unavailable: {exc}"
        )
        return None

    redis_host, redis_port = _redis_settings()
    pool = await create_pool(RedisSettings(host=redis_host, port=redis_port))
    try:
        metric_type = (
            task.metric_type.value
            if hasattr(task.metric_type, "value")
            else str(task.metric_type)
        )
        job = await pool.enqueue_job(
            "evaluate_submission_job",
            str(submission.id),
            submission.script_s3_key,
            task.private_test_url,
            metric_type,
            str(submission.runtime_profile_id),
        )
        return job.job_id if job else None
    finally:
        await _close_pool(pool)


@router.post("", response_model=SubmissionResponse, status_code=status.HTTP_201_CREATED)
async def create_submission(
    data: SubmissionCreate,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new submission for a hackathon task.
    Requires selecting an active runtime profile.
    """
    submission_repo = HackathonSubmissionRepository(session)
    profile_repo = RuntimeProfileRepository(session)
    task_repo = HackathonTaskRepository(session)

    uc = CreateSubmissionUseCase(submission_repo, profile_repo, task_repo)

    try:
        submission = await uc.execute(
            task_id=data.task_id,
            runtime_profile_id=data.runtime_profile_id,
            script_s3_key=data.script_s3_key,
            user_id=current_user["user_id"],
            team_id=data.team_id,
            model_s3_key=data.model_s3_key,
        )
        await session.commit()

        task = await task_repo.get(submission.task_id)
        if task:
            try:
                job_id = await _enqueue_submission_job(submission, task)
                logger.info(
                    f"Enqueued submission {submission.id} for evaluation as job {job_id}"
                )
            except Exception as exc:
                logger.warning(
                    f"Failed to enqueue submission {submission.id} for evaluation: {exc}"
                )

        return SubmissionResponse.model_validate(submission)
    except ValueError as e:
        await session.rollback()
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))


@router.get("/task/{task_id}", response_model=SubmissionListResponse)
async def list_submissions_for_task(
    task_id: UUID,
    my_only: bool = False,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    List submissions for a task.
    Query param `my_only=true` to filter only current user's submissions.
    Admins can see all submissions.
    """
    repo = HackathonSubmissionRepository(session)
    uc = ListSubmissionsUseCase(repo)

    is_admin = current_user.get("quiz_role") == "admin"

    if my_only or not is_admin:
        submissions = await uc.execute(
            task_id=task_id,
            user_id=current_user["user_id"],
        )
    else:
        submissions = await uc.execute(task_id=task_id)

    return SubmissionListResponse(
        submissions=[SubmissionResponse.model_validate(s) for s in submissions],
        total=len(submissions),
    )


@router.get("/task/{task_id}/best", response_model=SubmissionResponse)
async def get_best_submission(
    task_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Get the best (highest score) submission for current user on a task.
    """
    repo = HackathonSubmissionRepository(session)
    uc = GetBestSubmissionUseCase(repo)

    submission = await uc.execute(
        task_id=task_id,
        user_id=current_user["user_id"],
    )

    if not submission:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No completed submissions found",
        )

    return SubmissionResponse.model_validate(submission)


@router.get("/{submission_id}", response_model=SubmissionResponse)
async def get_submission(
    submission_id: UUID,
    session: AsyncSession = Depends(get_session),
    current_user: dict = Depends(get_current_user),
):
    """
    Get a submission by ID.
    Users can only see their own submissions, admins can see all.
    """
    repo = HackathonSubmissionRepository(session)
    uc = GetSubmissionUseCase(repo)

    try:
        submission = await uc.execute(submission_id)

        is_admin = current_user.get("quiz_role") == "admin"
        if not is_admin and submission.user_id != current_user["user_id"]:
            # TODO: Also check team_id if team submission.
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only view your own submissions",
            )

        return SubmissionResponse.model_validate(submission)
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(e))
