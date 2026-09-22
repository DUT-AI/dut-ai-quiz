from uuid import UUID

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.comment import CommentReactionEntity, ReactionType
from app.domain.interfaces import ICommentReactionRepository
from app.infrastructure.persistence.models import Comment, CommentReaction


class CommentReactionRepository(ICommentReactionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def get_reaction(self, comment_id: UUID, user_id: int) -> CommentReactionEntity | None:
        stmt = select(CommentReaction).where(
            CommentReaction.comment_id == comment_id, CommentReaction.user_id == user_id
        )
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    async def add_reaction(self, reaction: CommentReactionEntity) -> None:
        m = CommentReaction(
            comment_id=reaction.comment_id,
            user_id=reaction.user_id,
            reaction_type=reaction.reaction_type.value,
            created_at=reaction.created_at,
        )
        self._session.add(m)

        # Update counter
        if reaction.reaction_type == ReactionType.like:
            stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(like_count=Comment.like_count + 1)
            )
        else:
            stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(dislike_count=Comment.dislike_count + 1)
            )
        await self._session.execute(stmt)
        await self._session.flush()

    async def remove_reaction(self, reaction: CommentReactionEntity) -> None:
        stmt = select(CommentReaction).where(
            CommentReaction.comment_id == reaction.comment_id,
            CommentReaction.user_id == reaction.user_id,
        )
        result = await self._session.execute(stmt)
        m = result.scalar_one()
        await self._session.delete(m)

        # Update counter
        if reaction.reaction_type == ReactionType.like:
            update_stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(like_count=Comment.like_count - 1)
            )
        else:
            update_stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(dislike_count=Comment.dislike_count - 1)
            )
        await self._session.execute(update_stmt)
        await self._session.flush()

    async def switch_reaction(
        self, reaction: CommentReactionEntity, old_type: ReactionType
    ) -> None:
        stmt = (
            update(CommentReaction)
            .where(
                CommentReaction.comment_id == reaction.comment_id,
                CommentReaction.user_id == reaction.user_id,
            )
            .values(reaction_type=reaction.reaction_type.value)
        )
        await self._session.execute(stmt)

        # Update both counters
        if reaction.reaction_type == ReactionType.like:  # Switching from dislike to like
            update_stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(like_count=Comment.like_count + 1, dislike_count=Comment.dislike_count - 1)
            )
        else:  # Switching from like to dislike
            update_stmt = (
                update(Comment)
                .where(Comment.id == reaction.comment_id)
                .values(like_count=Comment.like_count - 1, dislike_count=Comment.dislike_count + 1)
            )
        await self._session.execute(update_stmt)
        await self._session.flush()
