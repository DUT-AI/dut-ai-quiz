from dataclasses import dataclass
from datetime import datetime
from enum import Enum
from typing import Optional
from uuid import UUID

class TargetType(str, Enum):
    system_feedback = "system_feedback"
    lesson_qna = "lesson_qna"

class ReactionType(str, Enum):
    like = "like"
    dislike = "dislike"

@dataclass
class CommentEntity:
    id: UUID
    target_type: TargetType
    user_id: int
    content: str
    target_id: Optional[UUID] = None
    parent_id: Optional[UUID] = None
    image_urls: list[str] = None
    like_count: int = 0
    dislike_count: int = 0
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    
    # Extra fields loaded from joined user
    user_role: Optional[str] = None
    user_name: Optional[str] = None
    user_avatar: Optional[str] = None
    
    # For tree structure in responses
    replies: list["CommentEntity"] = None

    def __post_init__(self):
        if self.image_urls is None:
            self.image_urls = []
        if self.replies is None:
            self.replies = []

@dataclass
class CommentReactionEntity:
    comment_id: UUID
    user_id: int
    reaction_type: ReactionType
    created_at: Optional[datetime] = None
