from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository
from app.domain.value_objects import GameSessionStatus
from app.infrastructure.persistence.models import GameSession
from app.infrastructure.persistence.models.user import User


class GameSessionRepository(IGameSessionRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def get(self, session_id: UUID, for_update: bool = False) -> GameSessionEntity | None:
        stmt = select(GameSession).where(GameSession.id == session_id)
        if for_update:
            stmt = stmt.with_for_update()
        r = await self._s.execute(stmt)
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
            model.lesson_slug = entity.lesson_slug
            model.completed_at = entity.completed_at
            model.status = entity.status
            model.question_limit = entity.question_limit
            model.final_score = entity.final_score
            model.gold_earned = entity.gold_earned
            model.total_time_response = entity.total_time_response
            model.attempt_count = entity.attempt_count
            model.current_tier = entity.current_tier
            model.question_sequence = [q.to_dict() for q in entity.question_sequence]
            model.gamification_state = entity.gamification.to_dict()
            await self._s.flush()
            await self._s.refresh(model)
            return model.to_entity()
        raise ValueError("Game session not found")

    async def get_active_by_lesson(
        self, user_id: int, lesson_slug: str
    ) -> GameSessionEntity | None:
        r = await self._s.execute(
            select(GameSession)
            .where(GameSession.user_id == user_id)
            .where(GameSession.status == GameSessionStatus.IN_PROGRESS)
            .where(GameSession.lesson_slug == lesson_slug)
            .order_by(GameSession.started_at.desc())
            .limit(1)
        )
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def count_completed_by_lesson(self, user_id: int, lesson_slug: str) -> int:
        r = await self._s.execute(
            select(func.count(GameSession.id))
            .where(GameSession.user_id == user_id)
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.lesson_slug == lesson_slug)
            .where(GameSession.question_limit > 0)
        )
        return r.scalar() or 0

    async def get_leaderboard_by_lesson(self, lesson_slug: str, limit: int = 100) -> list[dict]:
        subq = (
            select(GameSession.id)
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.lesson_slug == lesson_slug)
            .where(GameSession.question_limit > 0)
            .distinct(GameSession.user_id)
            .order_by(
                GameSession.user_id,
                GameSession.final_score.desc(),
                GameSession.gold_earned.desc(),
                GameSession.total_time_response.asc(),
                GameSession.attempt_count.asc(),
            )
        ).subquery()

        # Count total completed attempts for each user
        count_subq = (
            select(GameSession.user_id, func.count(GameSession.id).label("total_attempts"))
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.lesson_slug == lesson_slug)
            .where(GameSession.question_limit > 0)
            .group_by(GameSession.user_id)
        ).subquery()

        stmt = (
            select(GameSession, User, count_subq.c.total_attempts)
            .outerjoin(User, User.id == GameSession.user_id)
            .join(subq, GameSession.id == subq.c.id)
            .outerjoin(count_subq, GameSession.user_id == count_subq.c.user_id)
            .order_by(
                GameSession.final_score.desc(),
                GameSession.gold_earned.desc(),
                GameSession.total_time_response.asc(),
                GameSession.attempt_count.asc(),
            )
            .limit(limit)
        )

        r = await self._s.execute(stmt)
        rows = r.all()

        result = []
        for row in rows:
            q_seq = row.GameSession.question_sequence or []

            total_questions = len(q_seq) if q_seq else (row.GameSession.question_limit or 0)
            is_completed = bool(
                row.GameSession.status == GameSessionStatus.COMPLETED and total_questions > 0
            )

            result.append(
                {
                    "user_id": row.User.id if row.User else row.GameSession.user_id,
                    "username": row.User.name if row.User else None,
                    "avatar_url": row.User.avatar_url if row.User else None,
                    "final_score": float(row.GameSession.final_score),
                    "gold": int(row.GameSession.gold_earned),
                    "total_time_response": float(row.GameSession.total_time_response),
                    "attempt_count": int(row.total_attempts)
                    if row.total_attempts is not None
                    else int(row.GameSession.attempt_count),
                    "is_completed": is_completed,
                    "total_questions": total_questions,
                    "answered_questions": total_questions,
                    "completed_at": row.GameSession.completed_at.isoformat()
                    if row.GameSession.completed_at
                    else None,
                }
            )

        return result

    async def list_completed_sessions_for_sync(self, lesson_slug: str) -> list[dict]:
        stmt = (
            select(GameSession)
            .where(
                GameSession.status == GameSessionStatus.COMPLETED,
                GameSession.lesson_slug == lesson_slug,
                GameSession.completed_at.is_not(None),
            )
            .order_by(GameSession.completed_at.asc())
        )
        r = await self._s.execute(stmt)
        sessions = r.scalars().all()

        results = []
        for s in sessions:
            q_seq = s.question_sequence or []
            ps = s.gamification_state or {}

            total_q = len(q_seq) if q_seq else (s.question_limit or 0)
            correct_q = int(ps.get("correct_count", 0))

            lives = int(ps.get("lives", 0))
            last_idx = int(ps.get("last_question_index", 0))

            is_completed = total_q > 0 and last_idx >= total_q and lives > 0

            results.append(
                {
                    "session_id": str(s.id),
                    "user_id": s.user_id,
                    "completed_at": s.completed_at.isoformat() if s.completed_at else None,
                    "final_score": float(s.final_score),
                    "gold": int(s.gold_earned),
                    "attempt_count": int(s.attempt_count),
                    "is_completed": is_completed,
                    "total_questions": total_q,
                    "correct_count": correct_q,
                }
            )
        return results

    async def list_completed_by_user_and_lesson(
        self, user_id: int, lesson_slug: str, limit: int = 50
    ) -> list[GameSessionEntity]:
        stmt = (
            select(GameSession)
            .where(GameSession.user_id == user_id)
            .where(GameSession.status == GameSessionStatus.COMPLETED)
            .where(GameSession.lesson_slug == lesson_slug)
            .where(GameSession.question_limit > 0)
            .order_by(GameSession.started_at.desc())
            .limit(limit)
        )
        r = await self._s.execute(stmt)
        return [m.to_entity() for m in r.scalars().all()]
