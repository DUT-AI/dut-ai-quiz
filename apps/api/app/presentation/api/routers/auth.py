from fastapi import APIRouter, HTTPException, Response, Request
from dishka.integrations.fastapi import FromDishka, inject

from app.application.use_cases.auth.auth_use_case import ProxyLoginUseCase, LogoutUseCase, LoginPayload
from app.config import settings

router = APIRouter(prefix="/auth", tags=["auth"])

def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    # Set Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        domain=".dutai.site" if ".dutai.site" in settings.cors_origins else None,
        max_age=3600 * 24, # 1 day, adjust as needed
    )
    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        domain=".dutai.site" if ".dutai.site" in settings.cors_origins else None,
        max_age=3600 * 24 * 7, # 7 days, adjust as needed
    )

@router.post("/login")
@inject
async def login(
    payload: LoginPayload,
    response: Response,
    use_case: FromDishka[ProxyLoginUseCase]
):
    tokens = await use_case.execute(payload)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    _set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return {"is_success": True}

@router.post("/logout")
@inject
async def logout(
    request: Request,
    response: Response,
    use_case: FromDishka[LogoutUseCase]
):
    access_token = request.cookies.get("access_token")
    await use_case.execute(access_token)
    
    # Clear cookies
    domain = ".dutai.site" if ".dutai.site" in settings.cors_origins else None
    response.delete_cookie("access_token", domain=domain)
    response.delete_cookie("refresh_token", domain=domain)
    
    return {"is_success": True}
