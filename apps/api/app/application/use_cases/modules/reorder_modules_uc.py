from app.domain.interfaces.module_repo import IModuleRepository
from app.presentation.schemas.modules import ModuleReorder


class ReorderModulesUseCase:
    """Reorder modules in the system."""

    def __init__(self, repo: IModuleRepository) -> None:
        self._repo = repo

    async def execute(self, payload: ModuleReorder) -> None:
        """Execute the use case to reorder modules."""
        for idx, module_id in enumerate(payload.module_ids):
            module = await self._repo.get(module_id)
            if module:
                module.order = idx
                await self._repo.update(module)
