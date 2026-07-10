import json
from datetime import datetime
from uuid import UUID

from redis.asyncio import Redis

from app.domain.entities.submission import HackathonSubmissionEntity
from worker.domain.interfaces.event_publisher import ISubmissionEventPublisher


class RedisSubmissionEventPublisher(ISubmissionEventPublisher):
    def __init__(
        self, redis: Redis, channel: str = "hackathon:submission-events"
    ) -> None:
        self._redis = redis
        self._channel = channel

    async def publish_submission_update(
        self, submission: HackathonSubmissionEntity, event_type: str
    ) -> None:
        payload = {
            "type": event_type,
            "submission_id": str(submission.id),
            "task_id": str(submission.task_id),
            "user_id": submission.user_id,
            "team_id": str(submission.team_id) if submission.team_id else None,
            "status": submission.status.value,
            "public_score": submission.public_score,
            "private_score": submission.private_score,
            "inference_time": submission.inference_time,
            "error_message": submission.error_message,
            "updated_at": _to_json_value(submission.updated_at),
        }
        await self._redis.publish(self._channel, json.dumps(payload))


def _to_json_value(value: datetime | UUID | None) -> str | None:
    if value is None:
        return None
    return str(value)
