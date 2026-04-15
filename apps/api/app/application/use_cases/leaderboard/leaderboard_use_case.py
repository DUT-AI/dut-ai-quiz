from uuid import UUID
from app.infrastructure.repositories.attempts import AttemptRepository


class GetLeaderboardUseCase:
    def __init__(self, att_repo: AttemptRepository):
        self._att_repo = att_repo

    async def execute(self, exam_id: UUID, limit: int = 100) -> list[tuple[int, float]]:
        return await self._att_repo.leaderboard_best_per_user(exam_id, limit=limit)
