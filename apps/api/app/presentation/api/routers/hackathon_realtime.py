import asyncio
import json
import time
from collections.abc import AsyncIterator
from uuid import UUID

from dishka import Scope
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse
from redis.asyncio import from_url

from app.application.use_cases.hackathon.submissions import (
    GetHackathonSubmissionLeaderboardUseCase,
)
from app.config import settings
from app.presentation.api.deps import CurrentUser

router = APIRouter(prefix="/hackathons", tags=["hackathon-realtime"])

SUBMISSION_EVENTS_CHANNEL = "hackathon:submission-events"
HEARTBEAT_SECONDS = 15


@router.get("/tasks/{task_id}/leaderboard/events")
async def hackathon_task_leaderboard_events(
    request: Request,
    task_id: UUID,
    user: CurrentUser,
):
    return StreamingResponse(
        _leaderboard_event_stream(request, task_id),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )


async def _leaderboard_event_stream(
    request: Request,
    task_id: UUID,
) -> AsyncIterator[str]:
    redis = from_url(_redis_url_from_settings(), decode_responses=True)
    pubsub = redis.pubsub()
    next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS

    try:
        await pubsub.subscribe(SUBMISSION_EVENTS_CHANNEL)
        yield _sse_message(
            event="hackathon.leaderboard.updated",
            data=await _leaderboard_payload(request, task_id),
        )

        while not await request.is_disconnected():
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=1.0,
            )
            if message:
                event = _decode_pubsub_message(message.get("data"))
                if event and event.get("task_id") == str(task_id):
                    yield _sse_message(
                        event="hackathon.leaderboard.updated",
                        data=await _leaderboard_payload(
                            request, task_id, event=event
                        ),
                    )
                    next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS
                    continue

            if time.monotonic() >= next_heartbeat:
                yield ": keep-alive\n\n"
                next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS

            await asyncio.sleep(0)
    finally:
        await pubsub.unsubscribe(SUBMISSION_EVENTS_CHANNEL)
        await pubsub.close()
        await redis.aclose()


async def _leaderboard_payload(
    request: Request,
    task_id: UUID,
    event: dict | None = None,
) -> dict:
    async with request.app.state.dishka_container(
        scope=Scope.REQUEST
    ) as request_container:
        use_case = await request_container.get(
            GetHackathonSubmissionLeaderboardUseCase
        )
        rows = await use_case(task_id)

    return {
        "type": "hackathon.leaderboard.updated",
        "task_id": str(task_id),
        "event": event,
        "leaderboard": [row.to_dict() for row in rows],
    }


def _sse_message(event: str, data: dict) -> str:
    return f"event: {event}\ndata: {json.dumps(data)}\n\n"


def _decode_pubsub_message(data: str | bytes | None) -> dict | None:
    if data is None:
        return None
    if isinstance(data, bytes):
        data = data.decode("utf-8", errors="replace")
    try:
        return json.loads(data)
    except json.JSONDecodeError:
        return None


def _redis_url_from_settings() -> str:
    redis_host = str(settings.redis_host)
    if redis_host.startswith(("redis://", "rediss://")):
        return redis_host
    return f"redis://{redis_host}:{settings.redis_port}/0"
