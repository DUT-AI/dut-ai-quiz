from uuid import UUID

from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.practice.practice_use_case import (
    StartPracticeSessionUseCase,
    GetPracticeSessionUseCase,
    PatchPracticeAnswersUseCase,
    FinishPracticeSessionUseCase,
    ListPracticeHistoryUseCase,
)
from app.application.use_cases.practice.gamification_use_case import StartGamificationSessionUseCase
from app.presentation.api.deps import StudentUser
from app.presentation.schemas.attempts import AttemptAnswersPatch
from app.presentation.schemas.exams import PracticeStartIn
from app.presentation.schemas.practice import GamificationStartIn

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/sessions")
@inject
async def start_practice(
    user: StudentUser, 
    body: PracticeStartIn, 
    use_case: FromDishka[StartPracticeSessionUseCase]
):
    row = await use_case.execute(user.id, body)
    if not row:
        raise HTTPException(status_code=400, detail="No practice questions")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.post("/gamification")
@inject
async def start_gamification(
    user: StudentUser,
    body: GamificationStartIn,
    use_case: FromDishka[StartGamificationSessionUseCase]
):
    row = await use_case.execute(user.id, body)
    if not row:
        raise HTTPException(status_code=400, detail="No practice questions")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/{session_id}")
@inject
async def get_practice(
    user: StudentUser, 
    session_id: UUID, 
    use_case: FromDishka[GetPracticeSessionUseCase]
):
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.patch("/sessions/{session_id}/answers")
@inject
async def patch_practice(
    user: StudentUser, 
    session_id: UUID, 
    body: AttemptAnswersPatch, 
    use_case: FromDishka[PatchPracticeAnswersUseCase]
):
    ok = await use_case.execute(session_id, user.id, body)
    if not ok:
        raise HTTPException(status_code=400, detail="Cannot save")
    return {"ok": True}


@router.post("/sessions/{session_id}/finish")
@inject
async def finish_practice(
    user: StudentUser, 
    session_id: UUID, 
    use_case: FromDishka[FinishPracticeSessionUseCase]
):
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.get("/history")
@inject
async def practice_history(
    user: StudentUser, 
    use_case: FromDishka[ListPracticeHistoryUseCase]
):
    return await use_case.execute(user.id)
