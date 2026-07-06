from app.domain.interfaces import IPracticeSessionRepository


class GetPracticeHistorySummaryUseCase:
    def __init__(self, ps_repo: IPracticeSessionRepository):
        self._ps_repo = ps_repo

    async def execute(self, user_id: int) -> list[dict]:
        sessions = await self._ps_repo.list_history(user_id)

        summary = {}
        for s in sessions:
            if not s.snapshot:
                continue

            slug = s.snapshot.get("lesson_slug")
            if not slug:
                # Fallback to tags if lesson_slug is not explicitly in snapshot
                slug = s.tags_filter[0] if s.tags_filter else "unknown"

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

            gamification = s.snapshot.get("gamification", {})
            points = gamification.get("points", 0)
            gold = gamification.get("gold", 0)
            tier = gamification.get("current_tier", 1)

            if points > st["highest_points"]:
                st["highest_points"] = points

            st["total_gold_earned"] += gold

            if tier > st["highest_tier"]:
                st["highest_tier"] = tier

        return list(summary.values())
