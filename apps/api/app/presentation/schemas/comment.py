from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel, Field

from app.domain.entities.comment import CommentEntity, ReactionType, TargetType
from app.domain.interfaces.comment_repository import SortMode

class CommentCreate(BaseModel):
    target_type: TargetType
    target_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    content: str = Field(..., max_length=5000)
    image_urls: Optional[list[str]] = Field(default=[], max_items=3)

class CommentResponse(BaseModel):
    id: UUID
    target_type: TargetType
    target_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    user_id: int
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    user_role: Optional[str] = None
    content: str
    image_urls: list[str] = []
    like_count: int
    dislike_count: int
    created_at: datetime
    updated_at: datetime
    replies: list["CommentResponse"] = []

    @classmethod
    def from_entity(cls, entity: CommentEntity) -> "CommentResponse":
        return cls(
            id=entity.id,
            target_type=entity.target_type,
            target_id=entity.target_id,
            parent_id=entity.parent_id,
            user_id=entity.user_id,
            user_name=entity.user_name,
            user_avatar=entity.user_avatar,
            user_role=entity.user_role,
            content=entity.content,
            image_urls=entity.image_urls,
            like_count=entity.like_count,
            dislike_count=entity.dislike_count,
            created_at=entity.created_at,
            updated_at=entity.updated_at,
            replies=[cls.from_entity(r) for r in entity.replies]
        )

class ToggleReactionRequest(BaseModel):
    reaction_type: ReactionType

class PaginatedCommentsResponse(BaseModel):
    data: list[CommentResponse]
    total: int
    limit: int
    offset: int
