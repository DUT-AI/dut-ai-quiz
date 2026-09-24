from dataclasses import dataclass
from datetime import datetime
from enum import Enum
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
    target_id: UUID | None = None
    parent_id: UUID | None = None
    image_urls: list[str] = None
    like_count: int = 0
    dislike_count: int = 0
    created_at: datetime | None = None
    updated_at: datetime | None = None

    # Extra fields loaded from joined user
    user_role: str | None = None
    user_name: str | None = None
    user_avatar: str | None = None

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
    created_at: datetime | None = None
