from uuid import UUID, uuid4

from app.core.datetime_utils import now_ict
from app.domain.entities.tag import TagEntity
from app.domain.interfaces.tag_repo import ITagRepository
from app.presentation.schemas.tags import TagCreate


class ListTagsUseCase:
    """Use case to list all tags."""

    def __init__(self, tag_repo: ITagRepository):
        self._tag_repo = tag_repo

    async def execute(self) -> list[TagEntity]:
        return await self._tag_repo.list_all()


class CreateTagUseCase:
    """Use case to create a new tag."""

    def __init__(self, tag_repo: ITagRepository):
        self._tag_repo = tag_repo

    async def execute(self, payload: TagCreate) -> TagEntity:
        entity = TagEntity(
            id=uuid4(),
            name=payload.name,
            created_at=now_ict(),
        )
        return await self._tag_repo.add(entity)


class DeleteTagUseCase:
    """Use case to delete a tag by its ID."""

    def __init__(self, tag_repo: ITagRepository):
        self._tag_repo = tag_repo

    async def execute(self, tag_id: UUID) -> None:
        await self._tag_repo.delete(tag_id)
