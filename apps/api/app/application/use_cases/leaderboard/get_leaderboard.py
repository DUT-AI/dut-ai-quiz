from uuid import UUID

from app.infrastructure.repositories.attempts import AttemptRepository


async def execute(session, exam_id: UUID, limit: int = 100):
    repo = AttemptRepository(session)
    return await repo.leaderboard_best_per_user(exam_id, limit=limit)
