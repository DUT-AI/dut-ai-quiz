from uuid import UUID

from sqlalchemy import select, func, cast, Float, Integer
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.practice import PracticeSessionEntity
from app.domain.interfaces import IPracticeSessionRepository
from app.infrastructure.persistence.models import PracticeSession

class PracticeSessionRepository(IPracticeSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: UUID) -> PracticeSessionEntity | None:
        r = await self._s.execute(select(PracticeSession).where(PracticeSession.id == session_id))
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def list_history(self, user_id: int) -> list[PracticeSessionEntity]:
        r = await self._s.execute(
            select(PracticeSession)
            .where(PracticeSession.user_id == user_id)
            .order_by(PracticeSession.started_at.desc())
        )
        return [m.to_entity() for m in r.scalars().all()]

    async def add(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        model = PracticeSession.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def save(self, entity: PracticeSessionEntity) -> PracticeSessionEntity:
        r = await self._s.execute(select(PracticeSession).where(PracticeSession.id == entity.id))
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
        raise ValueError("Practice session not found")

    async def get_active_by_lesson(self, user_id: int, lesson_slug: str) -> PracticeSessionEntity | None:
        from app.domain.value_objects import PracticeSessionStatus
        r = await self._s.execute(
            select(PracticeSession)
            .where(PracticeSession.user_id == user_id)
            .where(PracticeSession.status == PracticeSessionStatus.IN_PROGRESS)
            .where(PracticeSession.tags_filter.contains([lesson_slug]))
            .order_by(PracticeSession.started_at.desc())
            .limit(1)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def count_completed_by_lesson(self, user_id: int, lesson_slug: str) -> int:
        from app.domain.value_objects import PracticeSessionStatus
        r = await self._s.execute(
            select(func.count(PracticeSession.id))
            .where(PracticeSession.user_id == user_id)
            .where(PracticeSession.status == PracticeSessionStatus.COMPLETED)
            .where(PracticeSession.tags_filter.contains([lesson_slug]))
        )
        return r.scalar() or 0

    async def get_leaderboard_by_lesson(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        from app.domain.value_objects import PracticeSessionStatus
        from app.infrastructure.persistence.models.user import User

        subq = (
            select(PracticeSession.id)
            .where(PracticeSession.status == PracticeSessionStatus.COMPLETED)
            .where(PracticeSession.tags_filter.contains([lesson_slug]))
            .distinct(PracticeSession.user_id)
            .order_by(
                PracticeSession.user_id,
                cast(PracticeSession.snapshot['gamification']['final_score'].astext, Float).desc(),
                cast(PracticeSession.snapshot['gamification']['gold'].astext, Integer).desc(),
                cast(PracticeSession.snapshot['gamification']['total_time_response'].astext, Float).asc(),
                cast(PracticeSession.snapshot['gamification']['attempt_count'].astext, Integer).asc(),
            )
        ).subquery()
        
        stmt = (
            select(PracticeSession, User)
            .join(User, User.id == PracticeSession.user_id)
            .join(subq, PracticeSession.id == subq.c.id)
            .order_by(
                cast(PracticeSession.snapshot['gamification']['final_score'].astext, Float).desc(),
                cast(PracticeSession.snapshot['gamification']['gold'].astext, Integer).desc(),
                cast(PracticeSession.snapshot['gamification']['total_time_response'].astext, Float).asc(),
                cast(PracticeSession.snapshot['gamification']['attempt_count'].astext, Integer).asc(),
            )
            .limit(limit)
        )
        
        r = await self._s.execute(stmt)
        rows = r.all()
        
        result = []
        for row in rows:
            ps = row.PracticeSession.snapshot.get('gamification', {})
            result.append({
                "user_id": row.User.id,
                "username": row.User.name,
                "avatar_url": row.User.avatar_url,
                "final_score": float(ps.get('final_score', 0)),
                "gold": int(ps.get('gold', 0)),
                "total_time_response": float(ps.get('total_time_response', 0)),
                "attempt_count": int(ps.get('attempt_count', 0))
            })
            
        return result
