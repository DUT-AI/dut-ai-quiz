from uuid import UUID

from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.practice.practice_use_case import (
    GetPracticeSessionUseCase,
    GetActivePracticeSessionUseCase,
    FinishPracticeSessionUseCase,
    ListPracticeHistoryUseCase,
)
from app.application.use_cases.practice.gamification_use_case import (
    StartGamificationSessionUseCase,
    UseItemGamificationUseCase,
    PatchGamificationAnswerUseCase,
)
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.practice import (
    GamificationStartIn,
    GamificationAnswerPatchIn,
    GamificationUseItemIn,
    GamificationAnswerResultOut,
)

router = APIRouter(prefix="/practice", tags=["practice"])


@router.post("/sessions")
@inject
async def start_practice(
    user: CurrentUser,
    body: GamificationStartIn,
    use_case: FromDishka[StartGamificationSessionUseCase]
):
    row = await use_case.execute(user.id, body)
    if not row:
        raise HTTPException(status_code=400, detail="No practice questions")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/active")
@inject
async def get_active_practice(
    user: CurrentUser,
    lesson_slug: str,
    use_case: FromDishka[GetActivePracticeSessionUseCase]
):
    row = await use_case.execute(user.id, lesson_slug)
    if not row:
        raise HTTPException(status_code=404, detail="No active practice session found")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/{session_id}")
@inject
async def get_practice(
    user: CurrentUser, 
    session_id: UUID, 
    use_case: FromDishka[GetPracticeSessionUseCase]
):
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.patch("/sessions/{session_id}/answers", response_model=GamificationAnswerResultOut)
@inject
async def patch_practice_answers(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationAnswerPatchIn,
    use_case: FromDishka[PatchGamificationAnswerUseCase]
):
    return await use_case.execute(session_id, user.id, body)


@router.post("/sessions/{session_id}/use-item")
@inject
async def use_item_practice(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationUseItemIn,
    use_case: FromDishka[UseItemGamificationUseCase]
):
    result = await use_case.execute(session_id, user.id, body)
    if result is None:
        raise HTTPException(status_code=400, detail="Cannot use item")
    return result


@router.post("/sessions/{session_id}/finish")
@inject
async def finish_practice(
    user: CurrentUser, 
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
    user: CurrentUser, 
    use_case: FromDishka[ListPracticeHistoryUseCase]
):
    return await use_case.execute(user.id)
