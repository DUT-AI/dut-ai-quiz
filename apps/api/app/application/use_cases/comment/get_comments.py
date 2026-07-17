from typing import Optional
from uuid import UUID

from app.domain.entities.comment import CommentEntity, TargetType
from app.domain.interfaces import ICommentRepository

class GetCommentsUseCase:
    def __init__(self, comment_repo: ICommentRepository):
        self._comment_repo = comment_repo

    async def get_root_comments(self, target_type: TargetType, target_id: Optional[UUID], sort_by: str, limit: int, offset: int) -> tuple[list[CommentEntity], int]:
        return await self._comment_repo.get_comments_tree(target_type, target_id, sort_by, limit, offset)

    async def get_replies(self, parent_id: UUID, sort_by: str, limit: int, offset: int) -> tuple[list[CommentEntity], int]:
        return await self._comment_repo.get_replies(parent_id, sort_by, limit, offset)
