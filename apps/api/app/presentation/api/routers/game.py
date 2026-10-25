from uuid import UUID

from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException

from app.application.services.game_hydration import hydrate_session_start_out
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
from app.domain.interfaces import IQuestionRepository
from app.presentation.api.deps import CurrentUser, ManageService
from app.presentation.schemas.game import (
    GameLeaderboardRowOut,
    GameLessonSummaryOut,
    GameSessionDetailOut,
    GameSessionReviewOut,
    GameSessionsSyncResponse,
    GameSessionStartOut,
    GameSessionSyncOutDTO,
    GamificationAnswerPatchIn,
    GamificationAnswerResultOut,
    GamificationStartIn,
    GamificationUseItemIn,
    UserMatchHistoryResponse,
)

router = APIRouter(prefix="/game", tags=["game"])


@router.post("/sessions", response_model=GameSessionStartOut)
@inject
async def start_game(
    user: CurrentUser,
    body: GamificationStartIn,
    use_case: FromDishka[StartGameSessionUseCase],
    question_repo: FromDishka[IQuestionRepository],
) -> GameSessionStartOut:
    row = await use_case.execute(user.id, body)
    if not row:
        raise HTTPException(status_code=400, detail="No game questions")
    return await hydrate_session_start_out(row, question_repo)


@router.get("/sessions/active", response_model=GameSessionStartOut)
@inject
async def get_active_game(
    user: CurrentUser,
    lesson_slug: str,
    use_case: FromDishka[GetActiveGameSessionUseCase],
    question_repo: FromDishka[IQuestionRepository],
) -> GameSessionStartOut:
    row = await use_case.execute(user.id, lesson_slug)
    if not row:
        raise HTTPException(status_code=404, detail="No active game session found")
    return await hydrate_session_start_out(row, question_repo)


@router.get("/sessions/{session_id}", response_model=GameSessionDetailOut)
@inject
async def get_game(
    user: CurrentUser,
    session_id: UUID,
    use_case: FromDishka[GetGameSessionUseCase],
    question_repo: FromDishka[IQuestionRepository],
) -> GameSessionDetailOut:
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    start_dto = await hydrate_session_start_out(row, question_repo)
    return GameSessionDetailOut(
        id=row.id,
        user_id=row.user_id,
        started_at=row.started_at,
        completed_at=row.completed_at,
        status=row.status.value if hasattr(row.status, "value") else str(row.status),
        snapshot=start_dto.snapshot,
        tags_filter=row.tags_filter,
        question_limit=row.question_limit,
    )


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


@router.post("/sessions/{session_id}/use-item")
@inject
async def use_item_game(
    user: CurrentUser,
    session_id: UUID,
    body: GamificationUseItemIn,
    use_case: FromDishka[UseItemGameUseCase],
):
    result = await use_case.execute(session_id, user.id, body)
    if result is None:
        raise HTTPException(status_code=400, detail="Cannot use item")
    return result


@router.post("/sessions/{session_id}/finish", response_model=GameSessionDetailOut)
@inject
async def finish_game(
    user: CurrentUser,
    session_id: UUID,
    use_case: FromDishka[FinishGameSessionUseCase],
    question_repo: FromDishka[IQuestionRepository],
) -> GameSessionDetailOut:
    row = await use_case.execute(session_id, user.id)
    if not row:
        raise HTTPException(status_code=404, detail="Not found")
    start_dto = await hydrate_session_start_out(row, question_repo)
    return GameSessionDetailOut(
        id=row.id,
        user_id=row.user_id,
        started_at=row.started_at,
        completed_at=row.completed_at,
        status=row.status.value if hasattr(row.status, "value") else str(row.status),
        snapshot=start_dto.snapshot,
        tags_filter=row.tags_filter,
        question_limit=row.question_limit,
    )


@router.get("/history", response_model=list[GameSessionDetailOut])
@inject
async def game_history(
    user: CurrentUser,
    use_case: FromDishka[ListGameHistoryUseCase],
    question_repo: FromDishka[IQuestionRepository],
) -> list[GameSessionDetailOut]:
    rows = await use_case.execute(user.id)
    results = []
    for row in rows:
        start_dto = await hydrate_session_start_out(row, question_repo)
        results.append(
            GameSessionDetailOut(
                id=row.id,
                user_id=row.user_id,
                started_at=row.started_at,
                completed_at=row.completed_at,
                status=row.status.value if hasattr(row.status, "value") else str(row.status),
                snapshot=start_dto.snapshot,
                tags_filter=row.tags_filter,
                question_limit=row.question_limit,
            )
        )
    return results


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
