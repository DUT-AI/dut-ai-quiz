from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter

from app.application.use_cases.tags.tags_use_case import (
    CreateTagUseCase,
    DeleteTagUseCase,
    ListTagsUseCase,
)
from app.presentation.api.deps import AdminOrMentorUser, CurrentUser
from app.presentation.schemas.tags import TagCreate, TagOut

router = APIRouter(prefix="/tags", tags=["tags"])


@router.get("", response_model=list[TagOut])
@inject
async def list_tags_route(
    user: CurrentUser,
    use_case: FromDishka[ListTagsUseCase],
):
    """Retrieve all tags. Accessible by any logged-in user."""
    return await use_case.execute()


@router.post("", response_model=TagOut)
@inject
async def create_tag_route(
    user: AdminOrMentorUser,
    body: TagCreate,
    use_case: FromDishka[CreateTagUseCase],
):
    """Create a new tag. Admin or Mentor only."""
    return await use_case.execute(body)


@router.delete("/{tag_id}")
@inject
async def delete_tag_route(
    tag_id: UUID,
    user: AdminOrMentorUser,
    use_case: FromDishka[DeleteTagUseCase],
):
    """Delete a tag by its ID. Admin or Mentor only."""
    await use_case.execute(tag_id)
    return {"status": "ok"}

