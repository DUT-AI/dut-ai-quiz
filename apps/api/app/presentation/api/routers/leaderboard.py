from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.leaderboard.leaderboard_use_case import GetLeaderboardUseCase
from app.application.use_cases.exams.exam_use_case import GetExamUseCase
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.attempts import LeaderboardRow

router = APIRouter(prefix="/exams", tags=["leaderboard"])


@router.get("/{exam_id}/leaderboard", response_model=list[LeaderboardRow])
@inject
async def leaderboard_route(
    user: CurrentUser,
    exam_id: UUID,
    get_exam: FromDishka[GetExamUseCase],
    use_case: FromDishka[GetLeaderboardUseCase],
    limit: int = Query(100, ge=1, le=500),
):
    ex = await get_exam.execute(exam_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    if user.quiz_role not in ("admin", "MENTOR") and not ex.is_published:
        raise HTTPException(status_code=404, detail="Not found")
    
    rows = await use_case.execute(exam_id, limit=limit)
    return [LeaderboardRow(user_id=u, best_score=s) for u, s in rows]
