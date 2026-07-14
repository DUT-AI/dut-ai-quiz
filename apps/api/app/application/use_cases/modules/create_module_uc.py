from uuid import uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.module import ModuleEntity
from app.domain.exceptions.exceptions import BadRequestException
from app.domain.interfaces.module_repo import IModuleRepository
from app.presentation.schemas.modules import ModuleCreate


class CreateModuleUseCase:
    """Create a new module in the system."""

    def __init__(self, repo: IModuleRepository) -> None:
        self._repo = repo

    async def execute(self, payload: ModuleCreate) -> ModuleEntity:
        """Execute the use case to create a module."""
        existing = await self._repo.get_by_name(payload.name)
        if existing:
            raise BadRequestException("Module with this name already exists")

        entity = ModuleEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            order=payload.order,
            created_at=now_ict(),
        )
        return await self._repo.add(entity)
