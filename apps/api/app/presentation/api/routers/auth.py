from urllib.parse import urlparse

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


def _cookie_domain() -> str | None:
    frontend_host = urlparse(settings.frontend_url).hostname or ""

    if frontend_host == "dutai.site" or frontend_host.endswith(".dutai.site"):
        return ".dutai.site"

    return None


def _cookie_secure() -> bool:
    return urlparse(settings.frontend_url).scheme == "https"


def _set_auth_cookies(
    response: Response,
    access_token: str,
    refresh_token: str | None,
):
    cookie_domain = _cookie_domain()
    cookie_secure = _cookie_secure()

    response.set_cookie(
        key="access_token",
        value=access_token,
        httponly=True,
        secure=cookie_secure,
        samesite="lax",
        domain=cookie_domain,
        max_age=3600 * 24,
        path="/",
    )

    if refresh_token:
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=cookie_secure,
            samesite="lax",
            domain=cookie_domain,
            max_age=3600 * 24 * 7,
            path="/",
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
        "token_type": "bearer",
    }


@router.get("/google/login")
@inject
async def google_login(
    google_oauth_client: FromDishka[GoogleOAuthClient],
):
    return RedirectResponse(url=google_oauth_client.get_authorization_url())


@router.get("/google/callback")
@inject
async def google_callback(
    code: str,
    use_case: FromDishka[GoogleAuthUseCase],
):
    try:
        tokens = await use_case.execute(code)
    except Exception as e:
        return RedirectResponse(
            url=f"{settings.frontend_url.rstrip('/')}/login?error={str(e)}"
        )

    redirect_res = RedirectResponse(url=settings.frontend_url)
    _set_auth_cookies(redirect_res, tokens.access_token, tokens.refresh_token)
    return redirect_res


@router.post("/logout")
@inject
async def logout(
    request: Request,
    response: Response,
    use_case: FromDishka[LogoutUseCase],
):
    access_token = request.cookies.get("access_token")
    await use_case.execute(access_token)

    cookie_domain = _cookie_domain()

    response.delete_cookie("access_token", domain=cookie_domain, path="/")
    response.delete_cookie("refresh_token", domain=cookie_domain, path="/")

    return {"is_success": True}