from typing import Protocol
from uuid import UUID

from app.domain.entities.module import ModuleEntity


class IModuleRepository(Protocol):
    """Interface protocol for ModuleRepository database operations."""

    async def list_all(
        self,
        *,
        q: str | None = None,
        name: str | None = None,
        description: str | None = None,
        order: int | None = None,
    ) -> list[ModuleEntity]:
        """List module entities with optional filtering, sorted by order and creation time."""
        ...

    async def get(self, module_id: UUID) -> ModuleEntity | None:
        """Get a single module entity by its UUID."""
        ...

    async def get_by_name(self, name: str) -> ModuleEntity | None:
        """Get a single module entity by name (case-insensitive)."""
        ...

    async def add(self, entity: ModuleEntity) -> ModuleEntity:
        """Add a new module entity to the store."""
        ...

    async def update(self, entity: ModuleEntity) -> ModuleEntity:
        """Update an existing module entity in the store."""
        ...

    async def delete(self, entity: ModuleEntity) -> None:
        """Delete a module entity from the store."""
        ...
