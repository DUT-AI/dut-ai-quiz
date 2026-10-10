from uuid import UUID

from app.domain.entities.module import ModuleEntity
from app.domain.exceptions.exceptions import BadRequestException
from app.domain.interfaces.module_repo import IModuleRepository
from app.presentation.schemas.modules import ModuleUpdate


class UpdateModuleUseCase:
    """Update an existing module in the system."""

    def __init__(self, repo: IModuleRepository) -> None:
        self._repo = repo

    async def execute(self, module_id: str, payload: ModuleUpdate) -> ModuleEntity | None:
        """Execute the use case to update the module."""
        entity = await self._repo.get(UUID(module_id))
        if not entity:
            return None

        if payload.name is not None:
            existing = await self._repo.get_by_name(payload.name)
            if existing and existing.id != entity.id:
                raise BadRequestException("Module with this name already exists")
            entity.name = payload.name
        if payload.description is not None:
            entity.description = payload.description
        if payload.order is not None:
            entity.order = payload.order

        return await self._repo.update(entity)
