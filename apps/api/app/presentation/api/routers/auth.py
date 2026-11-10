from dishka.integrations.fastapi import FromDishka, inject
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse, RedirectResponse

from app.application.dtos import LoginPayload
from app.application.dtos.auth import AuthTokens
from app.application.use_cases.auth import (
    GoogleAuthUseCase,
    LoginByManageAccountUseCase,
    LogoutUseCase,
)
from app.application.use_cases.auth.refresh import RefreshTokensUseCase
from app.config import settings
from app.infrastructure.clients import GoogleOAuthClient

router = APIRouter(prefix="/auth", tags=["auth"])


def require_trusted_origin(request: Request) -> None:
    origin = request.headers.get("origin")
    allowed = {*settings.cors_origin_list, settings.frontend_url.rstrip("/")}
    if (origin and origin.rstrip("/") not in allowed) or (
        not origin and request.headers.get("sec-fetch-site") == "cross-site"
    ):
        raise HTTPException(status_code=403, detail="Untrusted request origin")


def _clear_auth_cookies(response: Response) -> None:
    domain = ".dutai.site" if ".dutai.site" in settings.frontend_url else None
    response.delete_cookie("access_token", domain=domain, path="/")
    response.delete_cookie("refresh_token", domain=domain, path="/")
    response.headers["Cache-Control"] = "no-store"


def _set_auth_cookies(response: Response, tokens: AuthTokens) -> None:
    is_prod = ".dutai.site" in settings.frontend_url
    domain = ".dutai.site" if is_prod else None

    # Set Access Token Cookie
    response.set_cookie(
        key="access_token",
        value=tokens.access_token,
        httponly=True,
        secure=settings.frontend_url.startswith("https://"),
        samesite="lax",
        domain=domain,
        path="/",
        max_age=tokens.expires_in,
    )
    # Set Refresh Token Cookie
    response.set_cookie(
        key="refresh_token",
        value=tokens.refresh_token,
        httponly=True,
        secure=settings.frontend_url.startswith("https://"),
        samesite="lax",
        domain=domain,
        path="/",
        max_age=tokens.refresh_expires_in,
    )
    response.headers["Cache-Control"] = "no-store"


@router.post("/login", dependencies=[Depends(require_trusted_origin)])
@inject
async def login(
    payload: LoginPayload,
    response: Response,
    use_case: FromDishka[LoginByManageAccountUseCase],
):
    tokens = await use_case.execute(payload)
    if not tokens:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    _set_auth_cookies(response, tokens)
    return {
        "is_success": True,
        "access_token": tokens.access_token,
        "refresh_token": tokens.refresh_token,
        "expires_in": tokens.expires_in,
    }


@router.post("/refresh", dependencies=[Depends(require_trusted_origin)])
@inject
async def refresh(
    request: Request, response: Response, use_case: FromDishka[RefreshTokensUseCase]
):
    tokens = await use_case.execute(request.cookies.get("refresh_token"))
    if tokens is None:
        denied = JSONResponse(
            status_code=401,
            content={
                "is_success": False,
                "detail": "Refresh session expired or invalid",
            },
        )
        _clear_auth_cookies(denied)
        return denied
    _set_auth_cookies(response, tokens)
    return {"is_success": True, "expires_in": tokens.expires_in}


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
        return RedirectResponse(
            url=f"{settings.frontend_url.rstrip('/')}/login?error={str(e)}"
        )

    # Set cookies in the redirect response
    redirect_res = RedirectResponse(url=settings.frontend_url)
    _set_auth_cookies(redirect_res, tokens)
    return redirect_res


@router.post("/logout", dependencies=[Depends(require_trusted_origin)])
@inject
async def logout(
    request: Request, response: Response, use_case: FromDishka[LogoutUseCase]
):
    access_token = request.cookies.get("access_token")
    await use_case.execute(access_token, request.cookies.get("refresh_token"))

    # Clear cookies
    _clear_auth_cookies(response)

    return {"is_success": True}
