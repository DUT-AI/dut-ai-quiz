from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.comment import CommentReactionEntity, ReactionType


class ICommentReactionRepository(ABC):
    @abstractmethod
    async def get_reaction(self, comment_id: UUID, user_id: int) -> CommentReactionEntity | None:
        pass

    @abstractmethod
    async def add_reaction(self, reaction: CommentReactionEntity) -> None:
        """Adds a reaction and updates the comment count in a transaction."""
        pass

    @abstractmethod
    async def remove_reaction(self, reaction: CommentReactionEntity) -> None:
        """Removes a reaction and updates the comment count in a transaction."""
        pass

    @abstractmethod
    async def switch_reaction(self, reaction: CommentReactionEntity, old_type: ReactionType) -> None:
        """Switches a reaction type and updates both comment counts in a transaction."""
        pass
