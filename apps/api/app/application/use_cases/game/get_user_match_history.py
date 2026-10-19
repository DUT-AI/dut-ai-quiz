from app.application.services.user_service import UserService
from app.domain.interfaces import IGameSessionRepository
from app.presentation.schemas.game import UserMatchHistoryItem, UserMatchHistoryResponse


class GetUserMatchHistoryUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        user_service: UserService = None,
    ):
        self._ps_repo = ps_repo
        self._user_service = user_service

    async def execute(self, user_id: int, lesson_slug: str) -> UserMatchHistoryResponse:
        sessions = await self._ps_repo.list_completed_by_user_and_lesson(
            user_id=user_id,
            lesson_slug=lesson_slug,
            limit=50,
        )

        username = None
        avatar_url = None
        if self._user_service:
            try:
                user_info = await self._user_service.get_user_info(user_id)
                if user_info:
                    username = user_info.name
                    avatar_url = user_info.avatar_url
            except Exception:
                pass

        history_items: list[UserMatchHistoryItem] = []
        highest_score = 0.0
        total_gold = 0

        # sessions are ordered by started_at desc
        total_attempts = len(sessions)
        for idx, s in enumerate(sessions):
            # Attempt number: 1 is the oldest attempt, total_attempts is the newest
            attempt_number = total_attempts - idx

            snapshot = s.snapshot or {}
            gamification = snapshot.get("gamification", {})
            questions = snapshot.get("questions", [])

            total_q = len(questions) if questions else (s.question_limit or 0)
            correct_q = int(gamification.get("correct_count", 0))
            accuracy = round((correct_q / total_q) * 100, 1) if total_q > 0 else 0.0

            final_score = float(gamification.get("final_score", 0.0))
            raw_points = int(gamification.get("points", 0))
            gold = int(gamification.get("gold", 0))
            total_time_response = float(gamification.get("total_time_response", 0.0))
            lives = int(gamification.get("lives", 0))
            last_idx = int(gamification.get("last_question_index", 0))

            is_completed = total_q > 0 and last_idx >= total_q and lives > 0

            # Approximate streak: if 100% correct streak is total_q, else correct_q
            max_streak = correct_q if correct_q <= total_q else total_q

            if final_score > highest_score:
                highest_score = final_score
            total_gold += gold

            history_items.append(
                UserMatchHistoryItem(
                    id=str(s.id),
                    attempt_number=attempt_number,
                    started_at=s.started_at,
                    completed_at=s.completed_at,
                    final_score=final_score,
                    raw_points=raw_points,
                    gold=gold,
                    total_time_response=total_time_response,
                    correct_count=correct_q,
                    total_questions=total_q,
                    accuracy_percentage=accuracy,
                    max_streak=max_streak,
                    lives_left=lives,
                    is_completed=is_completed,
                )
            )

        return UserMatchHistoryResponse(
            user_id=user_id,
            username=username,
            avatar_url=avatar_url,
            lesson_slug=lesson_slug,
            total_attempts=total_attempts,
            highest_score=highest_score,
            total_gold=total_gold,
            history=history_items,
        )
