from typing import Optional
from uuid import UUID

from app.domain.entities.comment import CommentEntity, TargetType
from app.domain.interfaces import ICommentRepository
from app.application.services.user_service import UserService

class GetCommentsUseCase:
    def __init__(self, comment_repo: ICommentRepository, user_service: UserService):
        self._comment_repo = comment_repo
        self._user_service = user_service

    async def get_root_comments(self, target_type: TargetType, target_id: Optional[UUID], sort_by: str, limit: int, offset: int) -> tuple[list[CommentEntity], int]:
        comments, total = await self._comment_repo.get_comments_tree(target_type, target_id, sort_by, limit, offset)
        await self._user_service.resolve_authors(comments)
        return comments, total

    async def get_replies(self, parent_id: UUID, sort_by: str, limit: int, offset: int) -> tuple[list[CommentEntity], int]:
        comments, total = await self._comment_repo.get_replies(parent_id, sort_by, limit, offset)
        await self._user_service.resolve_authors(comments)
        return comments, total
