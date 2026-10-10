from collections.abc import Callable
from typing import Any

from app.domain.events.base import DomainEvent
from app.domain.events.bus import EventBus


class SimpleEventBus(EventBus):
    def __init__(self):
        self._handlers: dict[type[DomainEvent], list[Callable[[Any], Any]]] = {}

    async def publish(self, event: DomainEvent) -> None:
        import asyncio

        event_type = type(event)
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                # Fire and forget to avoid deadlocks in dev pool
                asyncio.create_task(handler(event))

    def subscribe(self, event_type: type[DomainEvent], handler: Callable[[Any], Any]) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
