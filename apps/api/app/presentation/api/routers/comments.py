from typing import Optional
from uuid import UUID

from dishka.integrations.fastapi import FromDishka as Inject
from dishka.integrations.fastapi import inject
from fastapi import APIRouter, Depends, Query

from app.application.use_cases.comment import (
    CreateCommentUseCase,
    DeleteCommentUseCase,
    GetCommentsUseCase,
    ToggleReactionUseCase,
)
from app.domain.entities.comment import TargetType
from app.domain.interfaces.comment_repository import SortMode
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.comment import (
    CommentCreate,
    CommentResponse,
    PaginatedCommentsResponse,
    ToggleReactionRequest,
)

router = APIRouter(prefix="/comments", tags=["Comments"])


@router.post("", response_model=CommentResponse)
@inject
async def create_comment(
    req: CommentCreate,
    use_case: Inject[CreateCommentUseCase],
    current_user: CurrentUser,
) -> CommentResponse:
    entity = await use_case.execute(
        user_id=current_user.id,
        target_type=req.target_type,
        content=req.content,
        target_id=req.target_id,
        parent_id=req.parent_id,
        image_urls=req.image_urls,
    )
    return CommentResponse.from_entity(entity)


@router.get("", response_model=PaginatedCommentsResponse)
@inject
async def get_comments(
    use_case: Inject[GetCommentsUseCase],
    target_type: TargetType = Query(...),
    target_id: Optional[UUID] = Query(None),
    sort_by: str = Query(SortMode.BEST, description="Sort mode: best, top_likes, top_dislikes, new, old"),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PaginatedCommentsResponse:
    comments, total = await use_case.get_root_comments(
        target_type=target_type,
        target_id=target_id,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    return PaginatedCommentsResponse(
        data=[CommentResponse.from_entity(c) for c in comments],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.get("/{comment_id}/replies", response_model=PaginatedCommentsResponse)
@inject
async def get_replies(
    comment_id: UUID,
    use_case: Inject[GetCommentsUseCase],
    sort_by: str = Query(SortMode.NEW),
    limit: int = Query(20, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> PaginatedCommentsResponse:
    comments, total = await use_case.get_replies(
        parent_id=comment_id,
        sort_by=sort_by,
        limit=limit,
        offset=offset,
    )
    return PaginatedCommentsResponse(
        data=[CommentResponse.from_entity(c) for c in comments],
        total=total,
        limit=limit,
        offset=offset,
    )


@router.post("/{comment_id}/reactions", status_code=204)
@inject
async def toggle_reaction(
    comment_id: UUID,
    req: ToggleReactionRequest,
    use_case: Inject[ToggleReactionUseCase],
    current_user: CurrentUser,
) -> None:
    await use_case.execute(
        user_id=current_user.id,
        comment_id=comment_id,
        reaction_type=req.reaction_type,
    )


@router.delete("/{comment_id}", status_code=204)
@inject
async def delete_comment(
    comment_id: UUID,
    use_case: Inject[DeleteCommentUseCase],
    current_user: CurrentUser,
) -> None:
    await use_case.execute(
        user_id=current_user.id,
        user_role=current_user.role_name,
        comment_id=comment_id,
    )
