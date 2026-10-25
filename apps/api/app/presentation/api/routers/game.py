from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException

from app.application.use_cases.game import (
    FinishGameSessionUseCase,
    GetActiveGameSessionUseCase,
    GetGameHistorySummaryUseCase,
    GetGameLeaderboardUseCase,
    GetGameSessionReviewUseCase,
    GetGameSessionUseCase,
    GetUserMatchHistoryUseCase,
    ListGameHistoryUseCase,
    ListGameSessionsForSyncUseCase,
    PatchGameAnswerUseCase,
    StartGameSessionUseCase,
    UseItemGameUseCase,
)
from app.presentation.api.deps import CurrentUser, ManageService
from app.presentation.schemas.game import (
    GameLeaderboardRowOut,
    GameLessonSummaryOut,
    GameSessionOut,
    GameSessionReviewOut,
    GameSessionsSyncResponse,
    GameSessionSyncOutDTO,
    GamificationAnswerPatchIn,
    GamificationAnswerResultOut,
    GamificationStartIn,
    GamificationUseItemIn,
    GamificationUseItemResultOut,
    UserMatchHistoryResponse,
)

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/sessions", response_model=GameSessionOut)
@inject
async def start_game(
    user: CurrentUser,
    body: GamificationStartIn,
    use_case: FromDishka[StartGameSessionUseCase],
) -> GameSessionOut:
    return await use_case.execute(user.id, body)


@router.get("/sessions/active", response_model=GameSessionOut)
@inject
async def get_active_game(
    user: CurrentUser,
    lesson_slug: str,
    use_case: FromDishka[GetActiveGameSessionUseCase],
) -> GameSessionOut:
    result = await use_case.execute(user.id, lesson_slug)
    if not result:
        raise HTTPException(status_code=404, detail="No active game session found")
    return result


@router.get("/sessions/{session_id}", response_model=GameSessionOut)
@inject
async def get_game(
    user: CurrentUser,
    session_id: UUID,
    use_case: FromDishka[GetGameSessionUseCase],
) -> GameSessionOut:
    result = await use_case.execute(session_id, user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result


@router.get("/sessions/{session_id}/review", response_model=GameSessionReviewOut)
@inject
async def get_game_session_review(
    user: CurrentUser,
    session_id: UUID,
    use_case: FromDishka[GetGameSessionReviewUseCase],
) -> GameSessionReviewOut:
    return await use_case.execute(session_id, user.id)


@router.patch(
    "/sessions/{session_id}/answers",
    response_model=GamificationAnswerResultOut,
    responses={409: {"description": "Turn already answered"}},
)
@inject
async def patch_game_answers(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationAnswerPatchIn,
    use_case: FromDishka[PatchGameAnswerUseCase],
) -> GamificationAnswerResultOut:
    return await use_case.execute(session_id, user.id, body, user_source=user.user_source)


@router.post("/sessions/{session_id}/use-item", response_model=GamificationUseItemResultOut)
@inject
async def use_item_game(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationUseItemIn,
    use_case: FromDishka[UseItemGameUseCase],
) -> GamificationUseItemResultOut:
    return await use_case.execute(session_id, user.id, body)


@router.post("/sessions/{session_id}/finish", response_model=GameSessionOut)
@inject
async def finish_game(
    user: CurrentUser,
    session_id: UUID,
    use_case: FromDishka[FinishGameSessionUseCase],
) -> GameSessionOut:
    result = await use_case.execute(session_id, user.id)
    if not result:
        raise HTTPException(status_code=404, detail="Not found")
    return result


@router.get("/history", response_model=list[GameSessionOut])
@inject
async def game_history(
    user: CurrentUser,
    use_case: FromDishka[ListGameHistoryUseCase],
) -> list[GameSessionOut]:
    return await use_case.execute(user.id)


@router.get("/history/summary", response_model=list[GameLessonSummaryOut])
@inject
async def game_history_summary(
    user: CurrentUser, use_case: FromDishka[GetGameHistorySummaryUseCase]
):
    return await use_case.execute(user.id)


@router.get("/users/{user_id}/summary", response_model=list[GameLessonSummaryOut])
@inject
async def get_user_game_summary_for_manage(
    user_id: int, _service: ManageService, use_case: FromDishka[GetGameHistorySummaryUseCase]
):
    """Lấy tóm tắt lịch sử game của 1 học viên dành cho Manage Service"""
    return await use_case.execute(user_id)


@router.get("/{lesson_slug}/leaderboard", response_model=list[GameLeaderboardRowOut])
@inject
async def get_game_leaderboard(lesson_slug: str, use_case: FromDishka[GetGameLeaderboardUseCase]):
    return await use_case.execute(lesson_slug)


@router.get("/{lesson_slug}/history/{user_id}", response_model=UserMatchHistoryResponse)
@inject
async def get_user_game_history(
    lesson_slug: str,
    user_id: int,
    use_case: FromDishka[GetUserMatchHistoryUseCase],
):
    return await use_case.execute(user_id=user_id, lesson_slug=lesson_slug)


@router.get("/{lesson_slug}/sessions-for-sync", response_model=GameSessionsSyncResponse)
@inject
async def list_game_sessions_for_sync(
    lesson_slug: str,
    use_case: FromDishka[ListGameSessionsForSyncUseCase],
) -> GameSessionsSyncResponse:
    data = await use_case.execute(lesson_slug)
    return GameSessionsSyncResponse(data=[GameSessionSyncOutDTO(**item) for item in data])
