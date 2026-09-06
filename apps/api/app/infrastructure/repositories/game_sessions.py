from uuid import UUID

from sqlalchemy import Float, Integer, cast, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository
from app.infrastructure.persistence.models import GameSession


class GameSessionRepository(IGameSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: UUID) -> GameSessionEntity | None:
        r = await self._s.execute(select(GameSession).where(GameSession.id == session_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_history(self, user_id: int) -> list[GameSessionEntity]:
        r = await self._s.execute(
            select(GameSession)
            .where(GameSession.user_id == user_id)
            .order_by(GameSession.started_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: GameSessionEntity) -> GameSessionEntity:
        model = GameSession.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def save(self, entity: GameSessionEntity) -> GameSessionEntity:
        r = await self._s.execute(select(GameSession).where(GameSession.id == entity.id))
        model = r.scalar_one_or_none()
        if model:
            model.completed_at = entity.completed_at
            model.status = entity.status
            model.snapshot = entity.snapshot
            model.tags_filter = entity.tags_filter
            model.question_limit = entity.question_limit
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Game session not found")

    async def get_active_by_lesson(self, user_id: int, lesson_slug: str) -> GameSessionEntity | None:
        from app.domain.value_objects import GameSessionStatus
        r = await self._s.execute(
            select(GameSession)
            .where(GameSession.user_id == user_id)
            .where(GameSession.status == GameSessionStatus.IN_PROGRESS)
            .where(GameSession.tags_filter.contains([lesson_slug]))
            .order_by(GameSession.started_at.desc())
            .limit(1)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def count_completed_by_lesson(self, user_id: int, lesson_slug: str) -> int:
        from app.domain.value_objects import GameSessionStatus
        r = await self._s.execute(
            select(func.count(GameSession.id))
            .where(GameSession.user_id == user_id)
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.tags_filter.contains([lesson_slug]))
            .where(GameSession.question_limit > 0)
        )
        return r.scalar() or 0

    async def get_leaderboard_by_lesson(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        from app.domain.value_objects import GameSessionStatus
        from app.infrastructure.persistence.models.user import User

        subq = (
            select(GameSession.id)
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.tags_filter.contains([lesson_slug]))
            .where(GameSession.question_limit > 0)
            .distinct(GameSession.user_id)
            .order_by(
                GameSession.user_id,
                cast(GameSession.snapshot['gamification']['final_score'].astext, Float).desc().nulls_last(),
                cast(GameSession.snapshot['gamification']['gold'].astext, Integer).desc().nulls_last(),
                cast(GameSession.snapshot['gamification']['total_time_response'].astext, Float).asc().nulls_last(),
                cast(GameSession.snapshot['gamification']['attempt_count'].astext, Integer).asc().nulls_last(),
            )
        ).subquery()

        # Count total completed attempts for each user
        count_subq = (
            select(
                GameSession.user_id,
                func.count(GameSession.id).label("total_attempts")
            )
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.tags_filter.contains([lesson_slug]))
            .where(GameSession.question_limit > 0)
            .group_by(GameSession.user_id)
        ).subquery()

        stmt = (
            select(GameSession, User, count_subq.c.total_attempts)
            .outerjoin(User, User.id == GameSession.user_id)
            .join(subq, GameSession.id == subq.c.id)
            .outerjoin(count_subq, GameSession.user_id == count_subq.c.user_id)
            .order_by(
                cast(GameSession.snapshot['gamification']['final_score'].astext, Float).desc().nulls_last(),
                cast(GameSession.snapshot['gamification']['gold'].astext, Integer).desc().nulls_last(),
                cast(GameSession.snapshot['gamification']['total_time_response'].astext, Float).asc().nulls_last(),
                cast(GameSession.snapshot['gamification']['attempt_count'].astext, Integer).asc().nulls_last(),
            )
            .limit(limit)
        )

        r = await self._s.execute(stmt)
        rows = r.all()

        result = []
        for row in rows:
            ps = row.GameSession.snapshot.get('gamification', {})
            result.append({
                "user_id": row.User.id if row.User else row.GameSession.user_id,
                "username": row.User.name if row.User else None,
                "avatar_url": row.User.avatar_url if row.User else None,
                "final_score": float(ps.get('final_score', 0)),
                "gold": int(ps.get('gold', 0)),
                "total_time_response": float(ps.get('total_time_response', 0)),
                "attempt_count": int(row.total_attempts) if row.total_attempts is not None else int(ps.get('attempt_count', 0))
            })

        return result
