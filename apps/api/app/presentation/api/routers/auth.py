from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, HTTPException, Request, Response
from fastapi.responses import RedirectResponse

from app.application.dtos import LoginPayload
from app.application.use_cases.auth import (
    GoogleAuthUseCase,
    LoginByManageAccountUseCase,
    LogoutUseCase,
)
from app.config import settings
from app.infrastructure.clients import GoogleOAuthClient

router = APIRouter(prefix="/auth", tags=["auth"])


def _set_auth_cookies(response: Response, access_token: str, refresh_token: str):
    is_prod = ".dutai.site" in settings.frontend_url
    domain = ".dutai.site" if is_prod else None

    # Set Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        domain=domain,
        max_age=3600 * 24,  # 1 day
    )
    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=refresh_token,
        httponly=True,
        secure=is_prod,
        samesite="lax",
        domain=domain,
        max_age=3600 * 24 * 7,  # 7 days
    )


@router.post("/login")
@inject
async def login(
    payload: LoginPayload,
    response: Response,
    use_case: FromDishka[LoginByManageAccountUseCase],
):
    tokens = await use_case.execute(payload)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    _set_auth_cookies(response, tokens.access_token, tokens.refresh_token)
    return {
        "is_success": True,
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
    }


@router.get("/google/login")
@inject
async def google_login(google_oauth_client: FromDishka[GoogleOAuthClient]):
    return RedirectResponse(url=google_oauth_client.get_authorization_url())


@router.get("/google/callback")
@inject
async def google_callback(
    code: str,
    response: Response,
    use_case: FromDishka[GoogleAuthUseCase],
):
    try:
        tokens = await use_case.execute(code)
    except Exception as e:
        # Redirect back to frontend login with error query param
        return RedirectResponse(url=f"{settings.frontend_url.rstrip('/')}/login?error={str(e)}")

    # Set cookies in the redirect response
    redirect_res = RedirectResponse(url=settings.frontend_url)
    _set_auth_cookies(redirect_res, tokens.access_token, tokens.refresh_token)
    return redirect_res


@router.post("/logout")
@inject
async def logout(request: Request, response: Response, use_case: FromDishka[LogoutUseCase]):
    access_token = request.cookies.get("access_token")
    await use_case.execute(access_token)

    # Clear cookies
    is_prod = ".dutai.site" in settings.frontend_url
    domain = ".dutai.site" if is_prod else None
    response.delete_cookie("access_token", domain=domain)
    response.delete_cookie("refresh_token", domain=domain)

    return {"is_success": True}
