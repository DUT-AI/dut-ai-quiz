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
from app.presentation.api.deps import CurrentUser, ManageService
from app.presentation.schemas.game import (
    GamificationStartIn,
    GamificationAnswerPatchIn,
    GamificationUseItemIn,
    GamificationAnswerResultOut,
    GameLessonSummaryOut,
    GameLeaderboardRowOut,
)

router = APIRouter(prefix="/game", tags=["game"])



def sanitize_game_snapshot(snapshot: dict | None) -> dict | None:
    if not snapshot:
        return snapshot
    import copy
    snap_copy = copy.deepcopy(snapshot)
    questions = snap_copy.get("questions", [])
    last_idx = snap_copy.get("gamification", {}).get("last_question_index", 0)
    for i, q in enumerate(questions):
        if i != last_idx:
            q["content"] = ""
            q["options"] = []
    return snap_copy


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
    return {"session_id": str(row.id), "snapshot": sanitize_game_snapshot(row.snapshot)}


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
    return {"session_id": str(row.id), "snapshot": sanitize_game_snapshot(row.snapshot)}


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
    import copy
    row_copy = copy.copy(row)
    row_copy.snapshot = sanitize_game_snapshot(row.snapshot)
    return row_copy


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
    import copy
    row_copy = copy.copy(row)
    row_copy.snapshot = sanitize_game_snapshot(row.snapshot)
    return row_copy


@router.get("/history")
@inject
async def game_history(
    user: CurrentUser, 
    use_case: FromDishka[ListGameHistoryUseCase]
):
    rows = await use_case.execute(user.id)
    import copy
    sanitized_rows = []
    for row in rows:
        row_copy = copy.copy(row)
        row_copy.snapshot = sanitize_game_snapshot(row.snapshot)
        sanitized_rows.append(row_copy)
    return sanitized_rows


@router.get("/history/summary", response_model=list[GameLessonSummaryOut])
@inject
async def game_history_summary(
    user: CurrentUser,
    use_case: FromDishka[GetGameHistorySummaryUseCase]
):
    return await use_case.execute(user.id)


@router.get("/users/{user_id}/summary", response_model=list[GameLessonSummaryOut])
@inject
async def get_user_game_summary_for_manage(
    user_id: int,
    _service: ManageService,
    use_case: FromDishka[GetGameHistorySummaryUseCase]
):
    """Lấy tóm tắt lịch sử game của 1 học viên dành cho Manage Service"""
    return await use_case.execute(user_id)


@router.get("/{lesson_slug}/leaderboard", response_model=list[GameLeaderboardRowOut])
@inject
async def get_game_leaderboard(
    lesson_slug: str,
    use_case: FromDishka[GetGameLeaderboardUseCase]
):
    return await use_case.execute(lesson_slug)

