import json
import time
from collections.abc import AsyncIterator
from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Request
from fastapi.responses import StreamingResponse

from app.application.use_cases.hackathon.submissions import (
    ViewHackathonLeaderboardUseCase,
)
from app.domain.interfaces import IHackathonEventSubscriber, IHackathonTaskRepository
from app.presentation.api.deps import CurrentUser

router = APIRouter(prefix="/hackathons", tags=["hackathon-realtime"])

HEARTBEAT_SECONDS = 15


@router.get("/{hackathon_id}/leaderboard/events")
@inject
async def hackathon_leaderboard_events(
    request: Request,
    hackathon_id: UUID,
    user: CurrentUser,
    subscriber: FromDishka[IHackathonEventSubscriber],
    view_uc: FromDishka[ViewHackathonLeaderboardUseCase],
    task_repo: FromDishka[IHackathonTaskRepository],
):
    def _sse_message(event: str, data: dict) -> str:
        return f"event: {event}\ndata: {json.dumps(data)}\n\n"

    async def event_stream() -> AsyncIterator[str]:
        next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS

        tasks = await task_repo.list_for_hackathon(hackathon_id)
        task_ids = {str(t.id) for t in tasks}

        # 1. Gửi bảng điểm hiện tại lần đầu
        data = await view_uc(hackathon_id)
        yield _sse_message(
            event="hackathon.leaderboard.updated",
            data={
                "type": "hackathon.leaderboard.updated",
                "hackathon_id": str(hackathon_id),
                "event": None,
                "leaderboard": data,
            },
        )

        # 2. Lắng nghe các event nộp bài để gửi cập nhật
        async for event in subscriber.subscribe_submission_events():
            if await request.is_disconnected():
                break

            if event is None:
                if time.monotonic() >= next_heartbeat:
                    yield ": keep-alive\n\n"
                    next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS
                continue

            if event.get("task_id") in task_ids:
                data = await view_uc(hackathon_id, force_refresh=True)
                yield _sse_message(
                    event="hackathon.leaderboard.updated",
                    data={
                        "type": "hackathon.leaderboard.updated",
                        "hackathon_id": str(hackathon_id),
                        "event": event,
                        "leaderboard": data,
                    },
                )
                next_heartbeat = time.monotonic() + HEARTBEAT_SECONDS

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
