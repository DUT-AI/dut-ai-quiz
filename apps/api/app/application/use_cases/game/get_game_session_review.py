from uuid import UUID

from app.domain.exceptions import EntityNotFoundException
from app.domain.interfaces import (
    IGameSessionAnswerRepository,
    IGameSessionRepository,
    IQuestionRepository,
)
from app.presentation.schemas.game import (
    GameQuestionOptionOut,
    GameSessionReviewItemOut,
    GameSessionReviewOut,
)


class GetGameSessionReviewUseCase:
    """Use case to retrieve granular post-match review and question timelines."""

    def __init__(
        self,
        ps_repo: IGameSessionRepository,
        question_repo: IQuestionRepository,
        answer_repo: IGameSessionAnswerRepository,
    ) -> None:
        self._ps_repo = ps_repo
        self._question_repo = question_repo
        self._answer_repo = answer_repo

    async def execute(self, session_id: UUID, user_id: int) -> GameSessionReviewOut:
        session = await self._ps_repo.get(session_id)
        if not session or session.user_id != user_id:
            raise EntityNotFoundException("Game session not found")

        answers = await self._answer_repo.list_by_session(session_id)
        items_out: list[GameSessionReviewItemOut] = []

        for ans in answers:
            q = await self._question_repo.get(ans.question_id)
            correct_opt_id = ""
            options_out: list[GameQuestionOptionOut] = []

            if q:
                for opt in q.options or []:
                    if opt.is_correct:
                        correct_opt_id = str(opt.id)
                    text = opt.text
                    options_out.append(GameQuestionOptionOut(id=str(opt.id), text=text))

            items_out.append(
                GameSessionReviewItemOut(
                    question_id=str(ans.question_id),
                    question_content=q.content if q else "",
                    explanation=getattr(q, "solution", getattr(q, "explanation", None))
                    if q
                    else None,
                    selected_option_id=str(ans.option_id),
                    correct_option_id=correct_opt_id,
                    is_correct=ans.is_correct,
                    time_response=ans.time_response,
                    points_gained=ans.points_gained,
                    options=options_out,
                )
            )

        return GameSessionReviewOut(
            session_id=str(session.id),
            user_id=session.user_id,
            completed_at=session.completed_at,
            final_score=session.gamification.final_score,
            total_questions=len(session.question_sequence),
            correct_count=session.gamification.correct_count,
            answers=items_out,
        )
