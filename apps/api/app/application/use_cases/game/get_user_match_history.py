from app.application.services.user_service import UserService
from app.domain.interfaces import IGameSessionRepository
from app.presentation.schemas.game import UserMatchHistoryItem, UserMatchHistoryResponse


class GetUserMatchHistoryUseCase:
    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        user_service: UserService,
    ) -> None:
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

            gam = s.gamification
            total_q = len(s.question_sequence) if s.question_sequence else (s.question_limit or 0)
            correct_q = int(gam.correct_count)
            accuracy = round((correct_q / total_q) * 100, 1) if total_q > 0 else 0.0

            final_score = float(s.final_score)
            raw_points = int(gam.points)
            gold = int(s.gold_earned)
            total_time_response = float(s.total_time_response)
            lives = int(gam.lives)
            last_idx = int(gam.last_question_index)

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
