from abc import ABC, abstractmethod
from uuid import UUID

from app.domain.entities.comment import CommentEntity, TargetType


class SortMode(str):
    BEST = "best"
    TOP_LIKES = "top_likes"
    TOP_DISLIKES = "top_dislikes"
    NEW = "new"
    OLD = "old"


class ICommentRepository(ABC):
    @abstractmethod
    async def create(self, comment: CommentEntity) -> CommentEntity:
        pass

    @abstractmethod
    async def get_by_id(self, comment_id: UUID) -> CommentEntity | None:
        pass

    @abstractmethod
    async def get_root_comments(
        self,
        target_type: TargetType,
        target_id: UUID | None,
        sort_by: str,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[CommentEntity], int]:
        """Returns root comments and total count."""
        pass

    @abstractmethod
    async def get_replies(
        self, parent_id: UUID, sort_by: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[CommentEntity], int]:
        """Returns replies for a given comment and total count."""
        pass

    @abstractmethod
    async def get_comments_tree(
        self,
        target_type: TargetType,
        target_id: UUID | None,
        sort_by: str,
        limit: int = 20,
        offset: int = 0,
    ) -> tuple[list[CommentEntity], int]:
        """Returns the comment tree up to level 3 depth."""
        pass

    @abstractmethod
    async def update(self, comment: CommentEntity) -> CommentEntity:
        pass

    @abstractmethod
    async def delete(self, comment_id: UUID) -> None:
        pass
