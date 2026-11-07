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

    async def list_for_attempt(self, attempt_id) -> list[FocusEventEntity]:
        """List all focus events for an attempt ordered by timestamp."""
        ...

    async def delete(self, event_id) -> bool:
        """Delete a single focus event by id. Returns True if deleted."""
        ...

    async def delete_for_attempt(self, attempt_id) -> int:
        """Delete all focus events for an attempt. Returns the number of deleted rows."""
        ...
