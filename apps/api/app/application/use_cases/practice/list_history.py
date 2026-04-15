from app.infrastructure.repositories.practice_sessions import PracticeSessionRepository


async def execute(session, user_id: int, limit: int = 50):
    repo = PracticeSessionRepository(session)
    return await repo.list_for_user(user_id, limit=limit)
