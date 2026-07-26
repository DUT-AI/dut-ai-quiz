from datetime import datetime
from uuid import UUID
import uuid

from sqlalchemy import ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql.sqltypes import Enum

from app.core.datetime_utils import now_ict
from app.domain.entities.comment import CommentEntity, TargetType
from .base import Base

class Comment(Base):
    __tablename__ = "comments"

    id: Mapped[UUID] = mapped_column(primary_key=True, default=uuid.uuid4)
    target_type: Mapped[str] = mapped_column(Enum(TargetType, native_enum=False, length=50), index=True)
    target_id: Mapped[UUID | None] = mapped_column(index=True, nullable=True)
    user_id: Mapped[int] = mapped_column(index=True)
    parent_id: Mapped[UUID | None] = mapped_column(ForeignKey("comments.id", ondelete="CASCADE"), index=True, nullable=True)
    content: Mapped[str] = mapped_column(Text)
    image_urls: Mapped[list[str] | None] = mapped_column(JSONB, nullable=True)
    like_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    dislike_count: Mapped[int] = mapped_column(Integer, default=0, server_default="0")
    created_at: Mapped[datetime] = mapped_column(default=now_ict, index=True)
    updated_at: Mapped[datetime] = mapped_column(default=now_ict, onupdate=now_ict)

    parent = relationship("Comment", remote_side=[id], backref="replies")

    def to_entity(self) -> CommentEntity:
        return CommentEntity(
            id=self.id,
            target_type=TargetType(self.target_type),
            target_id=self.target_id,
            user_id=self.user_id,
            parent_id=self.parent_id,
            content=self.content,
            image_urls=self.image_urls or [],
            like_count=self.like_count,
            dislike_count=self.dislike_count,
            created_at=self.created_at,
            updated_at=self.updated_at,
            user_role="guest",
            user_name=None,
            user_avatar=None
        )
