from datetime import datetime
from uuid import UUID

from sqlalchemy import ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.sql.sqltypes import Enum

from app.core.datetime_utils import now_ict
from app.domain.entities.comment import CommentReactionEntity, ReactionType

from .base import Base


class CommentReaction(Base):
    __tablename__ = "comment_reactions"

    comment_id: Mapped[UUID] = mapped_column(
        ForeignKey("comments.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[int] = mapped_column(primary_key=True)
    reaction_type: Mapped[str] = mapped_column(Enum(ReactionType, native_enum=False, length=20))
    created_at: Mapped[datetime] = mapped_column(default=now_ict)

    def to_entity(self) -> CommentReactionEntity:
        return CommentReactionEntity(
            comment_id=self.comment_id,
            user_id=self.user_id,
            reaction_type=ReactionType(self.reaction_type),
            created_at=self.created_at,
        )
