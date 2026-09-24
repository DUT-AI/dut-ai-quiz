from abc import ABC, abstractmethod
from collections.abc import Callable
from typing import Any

from .base import DomainEvent


class EventBus(ABC):
    @abstractmethod
    async def publish(self, event: DomainEvent) -> None:
        pass

    @abstractmethod
    def subscribe(self, event_type: type[DomainEvent], handler: Callable[[Any], Any]) -> None:
        pass
