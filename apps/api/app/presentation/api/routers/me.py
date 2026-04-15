from fastapi import APIRouter, Request, HTTPException
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.me.me_use_case import GetProfileUseCase
from app.presentation.api.deps import CurrentUser

router = APIRouter(prefix="/me", tags=["me"])


@router.get("")
@inject
async def me(
    request: Request,
    use_case: FromDishka[GetProfileUseCase]
):
    # Try to get access_token from cookie
    access_token = request.cookies.get("access_token")
    
    data = await use_case.execute(access_token)
    if not data:
        raise HTTPException(status_code=401, detail="Unauthorized")
        
    return {"data": data, "is_success": True}
