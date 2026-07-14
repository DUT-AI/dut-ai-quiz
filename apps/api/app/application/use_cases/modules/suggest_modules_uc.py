from app.domain.entities.module import ModuleEntity
from app.domain.interfaces.module_repo import IModuleRepository


class SuggestModulesUseCase:
    """Suggest existing modules by a search prefix."""

    def __init__(self, repo: IModuleRepository) -> None:
        self._repo = repo

    async def execute(self, q: str) -> list[ModuleEntity]:
        """Execute the use case to find modules starting with the prefix."""
        if not q.strip():
            return []
        return await self._repo.search_by_name_prefix(q.strip())
