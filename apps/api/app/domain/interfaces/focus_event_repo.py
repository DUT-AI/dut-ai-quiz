from typing import Protocol

from app.domain.entities.attempt import FocusEventEntity


class IFocusEventRepository(Protocol):
    """Interface protocol for FocusEventRepository database operations."""

    async def add(self, entity: FocusEventEntity) -> FocusEventEntity:
        """Add a focus event entity to the store."""
        ...

    async def exists_for_client_event(self, client_event_id: str) -> bool:
        """Check if a focus event with the given client_event_id already exists."""
        ...
