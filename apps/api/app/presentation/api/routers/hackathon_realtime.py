import json
from uuid import UUID

from dishka import Scope
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, status
from redis.asyncio import from_url

from app.application.services.auth_roles import quiz_role_from_manage
from app.application.use_cases.hackathon.submissions import (
    GetHackathonSubmissionLeaderboardUseCase,
)
from app.config import settings
from app.core.jwt import decode_access_token
from app.presentation.api.deps import UserContext

router = APIRouter(prefix="/hackathons", tags=["hackathon-realtime"])

SUBMISSION_EVENTS_CHANNEL = "hackathon:submission-events"


@router.websocket("/tasks/{task_id}/leaderboard/ws")
async def hackathon_task_leaderboard_ws(websocket: WebSocket, task_id: UUID):
    user = _authenticate_websocket(websocket)
    if not user:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    await websocket.accept()

    redis = from_url(_redis_url_from_settings(), decode_responses=True)
    pubsub = redis.pubsub()

    try:
        await pubsub.subscribe(SUBMISSION_EVENTS_CHANNEL)
        await _send_leaderboard_snapshot(websocket, task_id)

        while True:
            message = await pubsub.get_message(
                ignore_subscribe_messages=True,
                timeout=1.0,
            )
            if not message:
                continue

            event = _decode_pubsub_message(message.get("data"))
            if not event or event.get("task_id") != str(task_id):
                continue

            await _send_leaderboard_snapshot(websocket, task_id, event=event)
    except WebSocketDisconnect:
        return
    finally:
        await pubsub.unsubscribe(SUBMISSION_EVENTS_CHANNEL)
        await pubsub.close()
        await redis.aclose()


async def _send_leaderboard_snapshot(
    websocket: WebSocket,
    task_id: UUID,
    event: dict | None = None,
) -> None:
    async with websocket.app.state.dishka_container(
        scope=Scope.REQUEST
    ) as request_container:
        use_case = await request_container.get(
            GetHackathonSubmissionLeaderboardUseCase
        )
        rows = await use_case(task_id)

    await websocket.send_json(
        {
            "type": "hackathon.leaderboard.updated",
            "task_id": str(task_id),
            "event": event,
            "leaderboard": [row.to_dict() for row in rows],
        }
    )


def _authenticate_websocket(websocket: WebSocket) -> UserContext | None:
    if settings.auth_dev_bypass:
        role_name = settings.auth_dev_role_name
        return UserContext(
            id=settings.auth_dev_user_id,
            role_name=role_name,
            quiz_role=quiz_role_from_manage(role_name),
        )

    access_token = websocket.cookies.get("access_token") or websocket.query_params.get(
        "access_token"
    )
    if not access_token:
        return None

    payload = decode_access_token(access_token)
    if not payload:
        return None

    user_id = payload.get("user_id")
    role = payload.get("role")
    if user_id is None or role is None:
        return None

    return UserContext(id=int(user_id), role_name=role, quiz_role=role)


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
