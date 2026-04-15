from typing import Type, Callable, Any, Dict, List
from app.domain.events.base import DomainEvent
from app.domain.events.bus import EventBus

class SimpleEventBus(EventBus):
    def __init__(self):
        self._handlers: Dict[Type[DomainEvent], List[Callable[[Any], Any]]] = {}

    async def publish(self, event: DomainEvent) -> None:
        event_type = type(event)
        if event_type in self._handlers:
            for handler in self._handlers[event_type]:
                await handler(event)

    def subscribe(self, event_type: Type[DomainEvent], handler: Callable[[Any], Any]) -> None:
        if event_type not in self._handlers:
            self._handlers[event_type] = []
        self._handlers[event_type].append(handler)
