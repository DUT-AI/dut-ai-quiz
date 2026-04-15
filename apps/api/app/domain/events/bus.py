from abc import ABC, abstractmethod
from typing import Type, Callable, Any
from .base import DomainEvent

class EventBus(ABC):
    @abstractmethod
    async def publish(self, event: DomainEvent) -> None:
        pass

    @abstractmethod
    def subscribe(self, event_type: Type[DomainEvent], handler: Callable[[Any], Any]) -> None:
        pass
