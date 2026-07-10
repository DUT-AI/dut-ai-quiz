import json
import asyncio
from typing import AsyncIterator
from redis.asyncio import Redis

from app.domain.interfaces import IHackathonEventSubscriber

class RedisHackathonEventSubscriber(IHackathonEventSubscriber):
    def __init__(self, redis: Redis):
        self._redis = redis
        self._channel = "hackathon:submission-events"

    async def subscribe_submission_events(self) -> AsyncIterator[dict | None]:
        pubsub = self._redis.pubsub()
        await pubsub.subscribe(self._channel)
        try:
            while True:
                message = await pubsub.get_message(
                    ignore_subscribe_messages=True,
                    timeout=1.0,
                )
                if message and message.get("data"):
                    data = message.get("data")
                    if isinstance(data, bytes):
                        data = data.decode("utf-8", errors="replace")
                    try:
                        event = json.loads(data)
                        yield event
                    except json.JSONDecodeError:
                        yield None
                else:
                    yield None
                    
                await asyncio.sleep(0)
        finally:
            await pubsub.unsubscribe(self._channel)
            await pubsub.close()
