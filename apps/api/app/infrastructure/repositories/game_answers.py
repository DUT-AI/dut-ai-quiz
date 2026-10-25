from uuid import UUID

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.game_answer import GameSessionAnswerEntity
from app.domain.interfaces.game_answer_repo import IGameSessionAnswerRepository
from app.infrastructure.persistence.models.game_answer import GameSessionAnswer


class GameSessionAnswerRepository(IGameSessionAnswerRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def add(self, entity: GameSessionAnswerEntity) -> GameSessionAnswerEntity:
        model = GameSessionAnswer.from_entity(entity)
        self._s.add(model)
        await self._s.flush()
        await self._s.refresh(model)
        return model.to_entity()

    async def list_by_session(self, session_id: UUID) -> list[GameSessionAnswerEntity]:
        stmt = (
            select(GameSessionAnswer)
            .where(GameSessionAnswer.session_id == session_id)
            .order_by(GameSessionAnswer.answered_at.asc())
        )
        r = await self._s.execute(stmt)
        return [m.to_entity() for m in r.scalars().all()]

    async def get_by_turn(
        self, session_id: UUID, question_id: UUID
    ) -> GameSessionAnswerEntity | None:
        stmt = select(GameSessionAnswer).where(
            GameSessionAnswer.session_id == session_id,
            GameSessionAnswer.question_id == question_id,
        )
        r = await self._s.execute(stmt)
        model = r.scalar_one_or_none()
        return model.to_entity() if model else None

    async def count_by_session(self, session_id: UUID) -> int:
        stmt = (
            select(func.count())
            .select_from(GameSessionAnswer)
            .where(GameSessionAnswer.session_id == session_id)
        )
        r = await self._s.execute(stmt)
        return r.scalar_one() or 0
