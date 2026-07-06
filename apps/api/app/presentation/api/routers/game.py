from uuid import UUID

from fastapi import APIRouter, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.game import (
    GetGameSessionUseCase,
    GetActiveGameSessionUseCase,
    FinishGameSessionUseCase,
    ListGameHistoryUseCase,
    GetGameHistorySummaryUseCase,
    GetGameLeaderboardUseCase,
    StartGameSessionUseCase,
    PatchGameAnswerUseCase,
    UseItemGameUseCase,
)
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.game import (
    GamificationStartIn,
    GamificationAnswerPatchIn,
    GamificationUseItemIn,
    GamificationAnswerResultOut,
    GameLessonSummaryOut,
    GameLeaderboardRowOut,
)

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/sessions")
@inject
async def start_game(
    user: CurrentUser,
    body: GamificationStartIn,
    use_case: FromDishka[StartGameSessionUseCase]
):
    row = await use_case.execute(user.id, body)
    if not row:
        raise HTTPException(status_code=400, detail="No game questions")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/active")
@inject
async def get_active_game(
    user: CurrentUser,
    lesson_slug: str,
    use_case: FromDishka[GetActiveGameSessionUseCase]
):
    row = await use_case.execute(user.id, lesson_slug)
    if not row:
        raise HTTPException(status_code=404, detail="No active game session found")
    return {"session_id": str(row.id), "snapshot": row.snapshot}


@router.get("/sessions/{session_id}")
@inject
async def get_game(
    user: CurrentUser, 
    session_id: UUID, 
    use_case: FromDishka[GetGameSessionUseCase]
):
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.patch("/sessions/{session_id}/answers", response_model=GamificationAnswerResultOut)
@inject
async def patch_game_answers(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationAnswerPatchIn,
    use_case: FromDishka[PatchGameAnswerUseCase]
):
    return await use_case.execute(session_id, user.id, body)


@router.post("/sessions/{session_id}/use-item")
@inject
async def use_item_game(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationUseItemIn,
    use_case: FromDishka[UseItemGameUseCase]
):
    result = await use_case.execute(session_id, user.id, body)
    if result is None:
        raise HTTPException(status_code=400, detail="Cannot use item")
    return result


@router.post("/sessions/{session_id}/finish")
@inject
async def finish_game(
    user: CurrentUser, 
    session_id: UUID, 
    use_case: FromDishka[FinishGameSessionUseCase]
):
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    return row


@router.get("/history")
@inject
async def game_history(
    user: CurrentUser, 
    use_case: FromDishka[ListGameHistoryUseCase]
):
    return await use_case.execute(user.id)


@router.get("/history/summary", response_model=list[GameLessonSummaryOut])
@inject
async def game_history_summary(
    user: CurrentUser,
    use_case: FromDishka[GetGameHistorySummaryUseCase]
):
    return await use_case.execute(user.id)


@router.get("/{lesson_slug}/leaderboard", response_model=list[GameLeaderboardRowOut])
@inject
async def get_game_leaderboard(
    lesson_slug: str,
    use_case: FromDishka[GetGameLeaderboardUseCase]
):
    return await use_case.execute(lesson_slug)
