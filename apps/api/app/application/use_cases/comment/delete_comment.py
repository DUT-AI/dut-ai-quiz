from uuid import UUID

from app.domain.interfaces import ICommentRepository
from app.domain.exceptions.exceptions import AppException

class DeleteCommentUseCase:
    def __init__(self, comment_repo: ICommentRepository):
        self._comment_repo = comment_repo

    async def execute(self, user_id: int, user_role: str, comment_id: UUID) -> None:
        comment = await self._comment_repo.get_by_id(comment_id)
        if not comment:
            raise AppException(status_code=404, message="Bình luận không tồn tại.")
            
        # Only owner or admin can delete
        if comment.user_id != user_id and user_role != "admin":
            raise AppException(status_code=403, message="Bạn không có quyền xóa bình luận này.")
            
        await self._comment_repo.delete(comment_id)
