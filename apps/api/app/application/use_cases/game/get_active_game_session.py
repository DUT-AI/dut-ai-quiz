from app.domain.entities.game import GameSessionEntity
from app.domain.interfaces import IGameSessionRepository


class GetActiveGameSessionUseCase:
    def __init__(self, ps_repo: IGameSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int, lesson_slug: str) -> GameSessionEntity | None:
        session = await self._ps_repo.get_active_by_lesson(user_id, lesson_slug)
        if not session or not session.snapshot:
            return session

        snap = session.get_snapshot_state()
        state = snap.gamification
        current_q = snap.current_question()

        if current_q and not snap.is_game_over():
            needs_update = False
            # 1. If timer was cleared (intermission / question transition), start it now
            if state.current_question_started_at is None:
                state.reset_question_timer()
                needs_update = True
            # 2. If timer is stale (session resumed after hours/days of inactivity)
            elif state.is_question_timer_stale(current_q.time_limit, buffer=10.0):
                state.reset_question_timer()
                needs_update = True

            if needs_update:
                session.set_snapshot_state(snap)
                await self._ps_repo.save(session)

        return session
