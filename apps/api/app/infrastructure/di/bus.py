from dishka import Provider, Scope, provide
from redis.asyncio import Redis

from app.domain.events.bus import EventBus
from app.domain.interfaces import IHackathonEventSubscriber
from app.infrastructure.bus.hackathon_event_subscriber import RedisHackathonEventSubscriber
from app.infrastructure.bus.simple_bus import SimpleEventBus

class BusProvider(Provider):
    scope = Scope.APP
    
    @provide
    def event_bus(self) -> EventBus:
        return SimpleEventBus()

    @provide
    def hackathon_event_subscriber(self, redis: Redis) -> IHackathonEventSubscriber:
        return RedisHackathonEventSubscriber(redis)
