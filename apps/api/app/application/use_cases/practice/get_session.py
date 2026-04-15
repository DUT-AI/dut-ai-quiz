from uuid import UUID

from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository


async def execute(session, session_id: UUID, user_id: int):
    repo = PracticeSessionRepository(session)
    row = await repo.get(session_id)
    if not row or row.user_id != user_id:
        return None
    return row
