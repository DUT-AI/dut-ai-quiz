from app.domain.interfaces import IGameSessionRepository


class GetGameHistorySummaryUseCase:
    def __init__(self, ps_repo: IGameSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int) -> list[dict]:
        sessions = await self._ps_repo.list_history(user_id)

        summary = {}
        for s in sessions:
            if not s.lesson_slug or s.question_limit == 0:
                continue

            slug = s.lesson_slug

            if slug not in summary:
                summary[slug] = {
                    "lesson_slug": slug,
                    "total_sessions": 0,
                    "completed_sessions": 0,
                    "highest_points": 0,
                    "total_gold_earned": 0,
                    "highest_tier": 1,
                }

            st = summary[slug]
            st["total_sessions"] += 1
            if s.status == "COMPLETED":
                st["completed_sessions"] += 1

            points = int(s.final_score)
            gold = int(s.gold_earned)
            tier = int(s.current_tier)

            if points > st["highest_points"]:
                st["highest_points"] = points

            st["total_gold_earned"] += gold

            if tier > st["highest_tier"]:
                st["highest_tier"] = tier

        return list(summary.values())
