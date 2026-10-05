import asyncio
from typing import Any

import httpx
from loguru import logger

from app.config import settings
from app.domain.entities.homework import SubmissionType


async def _send_webhook_request(
    lesson_slug: str,
    user_id: int,
    submission_type: SubmissionType | str,
    is_passed: bool = True,
    details: dict[str, Any] | None = None,
) -> None:
    # Chỉ đồng bộ đối với học viên của Manage (user_id < 1,000,000)
    if user_id >= 1_000_000:
        return

    url = f"{settings.manage_base_url}/api/v1/homeworks/webhook/submission"
    if not url:
        return
    
    logger.debug(f"Manage URL: {url}")

    type_value = (
        submission_type.value
        if isinstance(submission_type, SubmissionType)
        else str(submission_type).upper()
    )

    payload = {
        "lesson_slug": lesson_slug,
        "user_id": user_id,
        "type": type_value,
        "is_passed": is_passed,
        "details": details or {},
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
                    f"user_id={user_id}, type={type_value}, is_passed={is_passed}"
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
    submission_type: SubmissionType | str,
    is_passed: bool = True,
    details: dict[str, Any] | None = None,
) -> None:
    """
    Non-blocking background dispatch of submission webhook to Manage.
    Được gọi ngay sau khi ghi nhận nộp bài Coding hoặc Game hoàn thành 100%.
    """
    if user_id >= 1_000_000:
        return
    try:
        loop = asyncio.get_running_loop()
        loop.create_task(
            _send_webhook_request(
                lesson_slug=lesson_slug,
                user_id=user_id,
                submission_type=submission_type,
                is_passed=is_passed,
                details=details,
            )
        )
    except RuntimeError:
        pass
