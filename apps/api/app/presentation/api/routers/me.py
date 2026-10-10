from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Request

from app.application.use_cases.attempts.attempt_use_case import ListUserAttemptsUseCase
from app.application.use_cases.me.me_use_case import GetProfileUseCase
from app.presentation.api.deps import CurrentUser
from app.presentation.schemas.attempts import AttemptOut

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
@inject
async def me(request: Request, use_case: FromDishka[GetProfileUseCase]):
    # Try to get access_token from Authorization Header first, then Cookie
    access_token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.strip().startswith("Bearer "):
        access_token = auth_header.strip().split(" ", 1)[1].strip()
    if not access_token:
        access_token = request.cookies.get("access_token")

    data = await use_case.execute(access_token)

    return {"data": data, "is_success": True}


@router.get("/attempts")
@inject
async def list_my_attempts(
    user: CurrentUser,
    use_case: FromDishka[ListUserAttemptsUseCase],
):
    results = await use_case.execute(user.id)
    return [
        {
            "attempt": AttemptOut.model_validate(r["attempt"]),
            "exam_title": r["exam_title"],
        }
        for r in results
    ]
