from uuid import UUID

from fastapi import APIRouter, HTTPException, Query

from app.application.use_cases.leaderboard.get_leaderboard import execute as get_leaderboard_uc
from app.infrastructure.repositories.exams import ExamRepository
from app.presentation.api.deps import CurrentUser, SessionDep
from app.presentation.schemas.attempts import LeaderboardRow

router = APIRouter(prefix="/exams", tags=["leaderboard"])


@router.get("/{exam_id}/leaderboard", response_model=list[LeaderboardRow])
async def leaderboard_route(
    session: SessionDep,
    user: CurrentUser,
    exam_id: UUID,
    limit: int = Query(100, ge=1, le=500),
):
    exam_repo = ExamRepository(session)
    ex = await exam_repo.get(exam_id)
    if not ex:
        raise HTTPException(status_code=404, detail="Not found")
    if user.quiz_role == "student" and not ex.is_published:
        raise HTTPException(status_code=404, detail="Not found")
    rows = await get_leaderboard_uc(session, exam_id, limit=limit)
    return [LeaderboardRow(user_id=u, best_score=s) for u, s in rows]
