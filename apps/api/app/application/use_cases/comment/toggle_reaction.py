from uuid import UUID

from app.domain.entities.comment import CommentReactionEntity, ReactionType
from app.domain.interfaces import ICommentReactionRepository, ICommentRepository
from app.domain.exceptions.exceptions import AppException

class ToggleReactionUseCase:
    def __init__(self, comment_reaction_repo: ICommentReactionRepository, comment_repo: ICommentRepository):
        self._comment_reaction_repo = comment_reaction_repo
        self._comment_repo = comment_repo

    async def execute(self, user_id: int, comment_id: UUID, reaction_type: ReactionType) -> None:
        # Check if comment exists
        comment = await self._comment_repo.get_by_id(comment_id)
        if not comment:
            raise AppException(status_code=404, message="Bình luận không tồn tại.")

        existing = await self._comment_reaction_repo.get_reaction(comment_id, user_id)
        
        if not existing:
            new_reaction = CommentReactionEntity(
                comment_id=comment_id,
                user_id=user_id,
                reaction_type=reaction_type,
            )
            await self._comment_reaction_repo.add_reaction(new_reaction)
        elif existing.reaction_type == reaction_type:
            # Same reaction -> toggle off (unlike/undislike)
            await self._comment_reaction_repo.remove_reaction(existing)
        else:
            # Different reaction -> switch
            new_reaction = CommentReactionEntity(
                comment_id=comment_id,
                user_id=user_id,
                reaction_type=reaction_type,
            )
            await self._comment_reaction_repo.switch_reaction(new_reaction, old_type=existing.reaction_type)
