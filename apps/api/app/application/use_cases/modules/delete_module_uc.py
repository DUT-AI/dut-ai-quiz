from uuid import UUID

from app.domain.interfaces.module_repo import IModuleRepository


class DeleteModuleUseCase:
    """Delete a module from the system."""

    def __init__(self, repo: IModuleRepository) -> None:
        self._repo = repo

    async def execute(self, module_id: str) -> bool:
        """Execute the use case to delete the module."""
        entity = await self._repo.get(UUID(module_id))
        if not entity:
            return False

        await self._repo.delete(entity)
        return True
