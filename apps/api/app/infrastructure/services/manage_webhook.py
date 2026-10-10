import asyncio
from datetime import datetime
from typing import Any

import httpx
from app.config import settings
from app.domain.entities.homework import SubmissionType
from app.domain.entities.user import UserSource
from loguru import logger


async def _send_webhook_request(
    lesson_slug: str,
    user_id: int,
    submission_type: SubmissionType,
    submitted_at: datetime,
    is_passed: bool = True,
    exercise_id: str | None = None,
    exercise_title: str | None = None,
    submission_id: str | None = None,
    attempt_number: int = 1,
    score: float | None = None,
    original_filename: str | None = None,
    details: dict[str, Any] | None = None,
    user_source: UserSource | str = UserSource.MANAGE,
) -> None:
    # Chỉ đồng bộ đối với học viên của Manage (UserSource.MANAGE)
    if isinstance(user_source, str):
        try:
            user_source = UserSource(user_source.upper())
        except ValueError:
            user_source = UserSource.INTERNAL

    if user_source != UserSource.MANAGE:
        logger.debug(
            f"ℹ️ [Manage Webhook] Skip sending webhook for non-Manage user {user_id} (source={user_source})"
        )
        return

    url = f"{settings.manage_base_url}/api/v1/homeworks/webhook/submission"
    if not url:
        return

    logger.debug(f"Manage URL: {url}")

    merged_details = dict(details or {})
    if submission_id:
        merged_details["submission_id"] = str(submission_id)
    if exercise_id:
        merged_details["exercise_id"] = str(exercise_id)
    if exercise_title:
        merged_details["exercise_title"] = exercise_title
    if score is not None:
        merged_details["score"] = score
    if attempt_number:
        merged_details["attempt_number"] = attempt_number
    if original_filename:
        merged_details["original_filename"] = original_filename

    payload = {
        "lesson_slug": lesson_slug,
        "user_id": user_id,
        "type": submission_type.value,
        "submitted_at": submitted_at.isoformat(),
        "is_passed": is_passed,
        "exercise_id": exercise_id,
        "exercise_title": exercise_title,
        "submission_id": submission_id,
        "attempt_number": attempt_number,
        "score": score,
        "original_filename": original_filename,
        "details": merged_details,
    }
    headers = {
        "Content-Type": "application/json",
        "X-Webhook-Secret": settings.manage_webhook_secret,
    }

    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.post(url, json=payload, headers=headers)
            if resp.status_code == 200:
                logger.info(
                    f"✅ [Manage Webhook] Sent submission event: slug={lesson_slug}, "
                    f"user_id={user_id}, type={submission_type.value}, exercise_id={exercise_id}, is_passed={is_passed}"
                )
            else:
                logger.warning(
                    f"⚠️ [Manage Webhook] Server returned status {resp.status_code}: {resp.text}"
                )
    except Exception as exc:
        logger.warning(
            f"⚠️ [Manage Webhook] Failed to connect to Manage ({url}): {exc}"
        )


def dispatch_manage_submission_webhook(
    lesson_slug: str,
    user_id: int,
    submission_type: SubmissionType,
    submitted_at: datetime,
    is_passed: bool = True,
    exercise_id: str | None = None,
    exercise_title: str | None = None,
    submission_id: str | None = None,
    attempt_number: int = 1,
    score: float | None = None,
    original_filename: str | None = None,
    details: dict[str, Any] | None = None,
    user_source: UserSource | str = UserSource.MANAGE,
) -> None:
    """
    Non-blocking background dispatch of submission webhook to Manage.
    Được gọi ngay sau khi ghi nhận nộp bài Coding hoặc Game hoàn thành 100%.
    Chỉ gửi webhook đồng bộ đối với học viên thuộc hệ thống Manage (UserSource.MANAGE).
    """
    if isinstance(user_source, str):
        try:
            user_source = UserSource(user_source.upper())
        except ValueError:
            user_source = UserSource.INTERNAL

    if user_source != UserSource.MANAGE:
        logger.debug(
            f"ℹ️ [Manage Webhook] Skip dispatch for non-Manage user {user_id} (source={user_source})"
        )
        return

    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            _send_webhook_request(
                lesson_slug=lesson_slug,
                user_id=user_id,
                submission_type=submission_type,
                submitted_at=submitted_at,
                is_passed=is_passed,
                exercise_id=exercise_id,
                exercise_title=exercise_title,
                submission_id=submission_id,
                attempt_number=attempt_number,
                score=score,
                original_filename=original_filename,
                details=details,
                user_source=user_source,
            )
        )
    except RuntimeError:
        pass

