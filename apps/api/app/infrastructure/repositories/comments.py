from uuid import UUID

from sqlalchemy import delete, func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.comment import CommentEntity, TargetType
from app.domain.interfaces import ICommentRepository, SortMode
from app.infrastructure.persistence.models import Comment


class CommentRepository(ICommentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, comment: CommentEntity) -> CommentEntity:
        import uuid

        from app.core.datetime_utils import now_ict
        m = Comment(
            id=comment.id or uuid.uuid4(),
            target_type=comment.target_type.value,
            target_id=comment.target_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            content=comment.content,
            image_urls=comment.image_urls,
            created_at=comment.created_at or now_ict(),
            updated_at=comment.updated_at or now_ict(),
        )
        self._session.add(m)
        await self._session.flush()


        # Load comment for the response
        stmt = select(Comment).where(Comment.id == m.id)
        result = await self._session.execute(stmt)
        m = result.scalar_one()
        return m.to_entity()

    async def get_by_id(self, comment_id: UUID) -> CommentEntity | None:
        stmt = select(Comment).where(Comment.id == comment_id)
        result = await self._session.execute(stmt)
        m = result.scalar_one_or_none()
        return m.to_entity() if m else None

    def _apply_sorting(self, stmt, sort_by: str):
        if sort_by == SortMode.BEST:
            score = Comment.like_count - Comment.dislike_count
            stmt = stmt.order_by(score.desc(), Comment.created_at.desc())
        elif sort_by == SortMode.TOP_LIKES:
            stmt = stmt.order_by(Comment.like_count.desc(), Comment.created_at.desc())
        elif sort_by == SortMode.TOP_DISLIKES:
            stmt = stmt.order_by(Comment.dislike_count.desc(), Comment.created_at.desc())
        elif sort_by == SortMode.OLD:
            stmt = stmt.order_by(Comment.created_at.asc())
        else: # NEW or default
            stmt = stmt.order_by(Comment.created_at.desc())
        return stmt

    async def get_root_comments(
        self, target_type: TargetType, target_id: UUID | None, sort_by: str, limit: int = 20, offset: int = 0
    ) -> tuple[list[CommentEntity], int]:

        # Count total
        count_stmt = select(func.count(Comment.id)).where(
            Comment.target_type == target_type.value,
            Comment.parent_id.is_(None)
        )
        if target_type == TargetType.lesson_qna and target_id:
            count_stmt = count_stmt.where(Comment.target_id == target_id)

        total_count = (await self._session.execute(count_stmt)).scalar_one()

        # Get items
        stmt = select(Comment).where(
            Comment.target_type == target_type.value,
            Comment.parent_id.is_(None)
        )

        if target_type == TargetType.lesson_qna and target_id:
            stmt = stmt.where(Comment.target_id == target_id)

        stmt = self._apply_sorting(stmt, sort_by)
        stmt = stmt.limit(limit).offset(offset)

        result = await self._session.execute(stmt)
        comments = result.scalars().all()
        return [c.to_entity() for c in comments], total_count

    async def get_replies(self, parent_id: UUID, sort_by: str, limit: int = 20, offset: int = 0) -> tuple[list[CommentEntity], int]:
        count_stmt = select(func.count(Comment.id)).where(Comment.parent_id == parent_id)
        total_count = (await self._session.execute(count_stmt)).scalar_one()

        stmt = select(Comment).where(Comment.parent_id == parent_id)
        stmt = self._apply_sorting(stmt, sort_by)
        stmt = stmt.limit(limit).offset(offset)

        result = await self._session.execute(stmt)
        comments = result.scalars().all()
        return [c.to_entity() for c in comments], total_count

    async def get_comments_tree(self, target_type: TargetType, target_id: UUID | None, sort_by: str, limit: int = 20, offset: int = 0) -> tuple[list[CommentEntity], int]:
        # Fetch root comments
        root_entities, total = await self.get_root_comments(target_type, target_id, sort_by, limit, offset)
        if not root_entities:
            return [], total

        # Level 1 IDs
        root_ids = [c.id for c in root_entities]

        # Fetch Level 2
        l2_stmt = select(Comment).where(Comment.parent_id.in_(root_ids))
        l2_stmt = self._apply_sorting(l2_stmt, sort_by)
        l2_result = await self._session.execute(l2_stmt)
        l2_comments = l2_result.scalars().all()
        l2_entities = [c.to_entity() for c in l2_comments]

        # Level 2 IDs
        l2_ids = [c.id for c in l2_entities]
        l3_entities = []
        if l2_ids:
            # Fetch Level 3 (and any deeper flattened to Level 3)
            l3_stmt = select(Comment).where(Comment.parent_id.in_(l2_ids))
            l3_stmt = self._apply_sorting(l3_stmt, sort_by)
            l3_result = await self._session.execute(l3_stmt)
            l3_comments = l3_result.scalars().all()
            l3_entities = [c.to_entity() for c in l3_comments]

        # Build tree in memory
        l2_dict = {}
        for l2 in l2_entities:
            l2_dict[l2.id] = l2
            for l3 in l3_entities:
                if l3.parent_id == l2.id:
                    l2.replies.append(l3)

        for root in root_entities:
            for l2 in l2_entities:
                if l2.parent_id == root.id:
                    root.replies.append(l2)

        return root_entities, total

    async def update(self, comment: CommentEntity) -> CommentEntity:
        stmt = update(Comment).where(Comment.id == comment.id).values(
            content=comment.content,
            image_urls=comment.image_urls,
            updated_at=func.now()
        ).returning(Comment)

        result = await self._session.execute(stmt)
        await self._session.flush()
        m = result.scalar_one()
        return m.to_entity()

    async def delete(self, comment_id: UUID) -> None:
        stmt = delete(Comment).where(Comment.id == comment_id)
        await self._session.execute(stmt)
        await self._session.flush()
