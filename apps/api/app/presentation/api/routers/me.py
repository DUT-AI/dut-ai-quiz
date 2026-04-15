from fastapi import APIRouter, Request

from app.application.use_cases.me.get_profile import execute as get_profile
from app.presentation.api.deps import CurrentUser

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
async def me(request: Request, user: CurrentUser):
    data = await get_profile(request)
    return {"data": data, "is_success": True}
