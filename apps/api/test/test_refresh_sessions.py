from datetime import UTC, datetime, timedelta
from types import SimpleNamespace
from unittest.mock import AsyncMock

import jwt
import pytest
from app.application.dtos.auth import LoginPayload
from app.application.services.auth_sessions import AuthSessionService
from app.application.use_cases.auth.login_by_google import GoogleAuthUseCase
from app.application.use_cases.auth.login_by_manage_account import (
    LoginByManageAccountUseCase,
)
from app.application.use_cases.auth.logout import LogoutUseCase
from app.application.use_cases.auth.refresh import RefreshTokensUseCase
from app.config import settings
from app.core.jwt import decode_access_token
from app.domain.entities.auth_session import RefreshTokenEntity
from app.domain.entities.manage_service import ManageAuthTokens, ManageUserProfile
from app.domain.entities.user import UserEntity, UserSource
from app.domain.exceptions.exceptions import ServiceUnavailableException
from app.infrastructure.services.token_service import TokenService
from app.presentation.api.exceptions import setup_exception_handlers
from app.presentation.api.routers.auth import router
from dishka import Provider, Scope, make_async_container, provide
from dishka.integrations.fastapi import setup_dishka
from fastapi import FastAPI
from fastapi.testclient import TestClient


class MemorySessionRepository:
    def __init__(self):
        self.sessions = {}
        self.tokens = {}
        self.commits = 0

    async def add(self, session, token_hash):
        self.sessions[session.id] = session
        self.tokens[token_hash] = RefreshTokenEntity(token_hash, session.id)

    async def lock_by_token(self, token_hash):
        token = self.tokens.get(token_hash)
        return (self.sessions[token.session_id], token) if token else None

    async def rotate(self, token_hash, new_hash, now):
        token = self.tokens[token_hash]
        token.used_at = now
        self.tokens[new_hash] = RefreshTokenEntity(new_hash, token.session_id)

    async def revoke(self, session_id, now):
        self.sessions[session_id].revoked_at = now

    async def commit(self):
        self.commits += 1


@pytest.fixture
def auth(monkeypatch):
    monkeypatch.setattr(settings, "auth_dev_bypass", False)
    monkeypatch.setattr(settings, "jwt_secret_key", "test-signing-key-" * 4)
    monkeypatch.setattr(settings, "jwt_expire_minutes", 15)
    monkeypatch.setattr(settings, "jwt_refresh_expire_days", 7)
    repo = MemorySessionRepository()
    tokens = TokenService()
    sessions = AuthSessionService(repo, tokens)
    profile = ManageUserProfile(
        id=42, email="user@example.com", name="User", role_names=["student"]
    )
    manage = SimpleNamespace(
        get_profile=AsyncMock(return_value=profile),
        get_own_profile=AsyncMock(return_value=profile),
        login=AsyncMock(
            return_value=ManageAuthTokens("upstream-access", "upstream-refresh")
        ),
        find_user_by_email=AsyncMock(return_value=[]),
    )
    user = UserEntity(
        id=42,
        email="guest@example.com",
        role="guest",
        google_id="google-42",
        user_source=UserSource.GOOGLE,
    )
    users = SimpleNamespace(
        get_by_id=AsyncMock(return_value=user),
        get_by_email=AsyncMock(return_value=user),
    )
    cache = SimpleNamespace(delete=AsyncMock())
    refresh = RefreshTokensUseCase(repo, tokens, sessions, users, manage)
    return SimpleNamespace(
        repo=repo,
        tokens=tokens,
        sessions=sessions,
        refresh=refresh,
        manage=manage,
        users=users,
        cache=cache,
    )


@pytest.mark.asyncio
async def test_rotation_reissues_both_tokens_and_updates_roles(auth):
    original = await auth.sessions.create(42, "MANAGE", ["admin"])
    replacement = await auth.refresh.execute(original.refresh_token)
    assert replacement and replacement.refresh_token != original.refresh_token
    assert replacement.access_token != original.access_token
    assert decode_access_token(replacement.access_token)["roles"] == ["student"]
    assert original.refresh_token not in auth.repo.tokens
    assert auth.repo.tokens[auth.tokens.hash_refresh(original.refresh_token)].used_at
    assert replacement.refresh_expires_in <= original.refresh_expires_in
    assert replacement.expires_in <= 900


@pytest.mark.asyncio
async def test_replay_revokes_entire_token_family_and_commits(auth):
    original = await auth.sessions.create(42, "MANAGE", ["student"])
    replacement = await auth.refresh.execute(original.refresh_token)
    before = auth.repo.commits
    assert await auth.refresh.execute(original.refresh_token) is None
    assert auth.repo.commits == before + 1
    assert await auth.refresh.execute(replacement.refresh_token) is None


@pytest.mark.asyncio
async def test_expired_unknown_or_missing_refresh_cannot_issue_tokens(auth):
    original = await auth.sessions.create(42, "MANAGE", ["student"])
    session = next(iter(auth.repo.sessions.values()))
    session.expires_at = datetime.now(UTC) - timedelta(seconds=1)
    for value in (None, "", "made-up-token", original.refresh_token):
        assert await auth.refresh.execute(value) is None
    auth.manage.get_profile.assert_not_called()


@pytest.mark.asyncio
async def test_refresh_never_extends_absolute_session_deadline(auth):
    original = await auth.sessions.create(42, "MANAGE", ["student"])
    session = next(iter(auth.repo.sessions.values()))
    session.expires_at = datetime.now(UTC) + timedelta(seconds=60)
    replacement = await auth.refresh.execute(original.refresh_token)
    assert 0 < replacement.refresh_expires_in <= 60
    assert 0 < replacement.expires_in <= 60
    claims = decode_access_token(replacement.access_token)
    assert claims["exp"] <= int(session.expires_at.timestamp())


@pytest.mark.asyncio
async def test_transient_manage_failure_does_not_consume_refresh(auth):
    original = await auth.sessions.create(42, "MANAGE", ["student"])
    auth.manage.get_profile.side_effect = ServiceUnavailableException()
    with pytest.raises(ServiceUnavailableException):
        await auth.refresh.execute(original.refresh_token)
    assert (
        auth.repo.tokens[auth.tokens.hash_refresh(original.refresh_token)].used_at
        is None
    )
    assert next(iter(auth.repo.sessions.values())).revoked_at is None
    auth.manage.get_profile.side_effect = None
    assert await auth.refresh.execute(original.refresh_token)


@pytest.mark.asyncio
@pytest.mark.parametrize("source", ["MANAGE", "GOOGLE"])
async def test_deleted_user_revokes_session(auth, source):
    original = await auth.sessions.create(42, source, ["student"])
    auth.manage.get_profile.return_value = None
    auth.users.get_by_id.return_value = None
    assert await auth.refresh.execute(original.refresh_token) is None
    assert next(iter(auth.repo.sessions.values())).revoked_at


@pytest.mark.asyncio
async def test_equal_ids_from_different_sources_are_not_confused(auth):
    manage = await auth.sessions.create(42, "MANAGE", ["student"])
    google = await auth.sessions.create(42, "GOOGLE", ["guest"])
    manage_new = await auth.refresh.execute(manage.refresh_token)
    google_new = await auth.refresh.execute(google.refresh_token)
    assert decode_access_token(manage_new.access_token)["type"] == "service_a"
    claims = decode_access_token(google_new.access_token)
    assert claims["type"] == "google" and claims["user_source"] == "GOOGLE"
    assert claims["roles"] == ["guest"]


@pytest.mark.asyncio
async def test_login_manage_and_both_google_branches_create_sessions(auth):
    login = LoginByManageAccountUseCase(auth.manage, auth.sessions)
    managed = await login.execute(
        LoginPayload(email="user@example.com", password="password")
    )
    google_client = SimpleNamespace(
        exchange_code=AsyncMock(return_value="google-oauth"),
        get_user_info=AsyncMock(return_value={"email": "guest@example.com"}),
    )
    google = GoogleAuthUseCase(auth.users, google_client, auth.manage, auth.sessions)
    guest = await google.execute("code")
    auth.manage.find_user_by_email.return_value = [await auth.manage.get_profile(42)]
    google_client.get_user_info.return_value = {"email": "user@example.com"}
    linked = await google.execute("code")
    assert all(t.refresh_token for t in (managed, guest, linked))
    assert len(auth.repo.sessions) == 3
    assert managed.refresh_token != "upstream-refresh"


@pytest.mark.asyncio
async def test_logout_revokes_even_if_access_has_expired_and_cookie_is_old(auth):
    original = await auth.sessions.create(42, "MANAGE", ["student"])
    replacement = await auth.refresh.execute(original.refresh_token)
    logout = LogoutUseCase(auth.cache, auth.repo, auth.tokens)
    await logout.execute("expired-access", original.refresh_token)
    assert await auth.refresh.execute(replacement.refresh_token) is None
    auth.cache.delete.assert_awaited_once_with("expired-access")


def test_non_access_jwt_and_opaque_refresh_rejected_by_access_decoder(auth):
    signed = jwt.encode(
        {
            "token_use": "refresh",
            "user_id": 42,
            "roles": ["admin"],
            "exp": datetime.now(UTC) + timedelta(days=7),
        },
        settings.jwt_secret_key,
        algorithm=settings.jwt_algorithm,
    )
    assert decode_access_token(signed) is None
    assert decode_access_token(auth.tokens.create_refresh()) is None


@pytest.fixture
def client(auth, monkeypatch):
    monkeypatch.setattr(settings, "frontend_url", "http://testserver")

    class AuthProvider(Provider):
        @provide(scope=Scope.REQUEST)
        def refresh(self) -> RefreshTokensUseCase:
            return auth.refresh

        @provide(scope=Scope.REQUEST)
        def login(self) -> LoginByManageAccountUseCase:
            return LoginByManageAccountUseCase(auth.manage, auth.sessions)

        @provide(scope=Scope.REQUEST)
        def logout(self) -> LogoutUseCase:
            return LogoutUseCase(auth.cache, auth.repo, auth.tokens)

    app = FastAPI()
    app.include_router(router, prefix="/api/v1")
    setup_exception_handlers(app)
    setup_dishka(make_async_container(AuthProvider()), app)
    with TestClient(app) as client:
        yield client


def test_http_refresh_without_access_cookie_and_logout(client, auth):
    login = client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": "password"}
    )
    assert login.status_code == 200
    old_refresh = client.cookies.get("refresh_token")
    assert old_refresh and "HttpOnly" in login.headers["set-cookie"]
    assert "Max-Age=900" in login.headers["set-cookie"]
    client.cookies.delete("access_token")
    refreshed = client.post("/api/v1/auth/refresh")
    assert refreshed.status_code == 200
    assert refreshed.headers["cache-control"] == "no-store"
    assert client.cookies.get("refresh_token") != old_refresh
    assert client.cookies.get("access_token")
    assert client.post("/api/v1/auth/logout").status_code == 200
    assert not client.cookies.get("access_token")
    assert not client.cookies.get("refresh_token")
    assert client.post("/api/v1/auth/refresh").status_code == 401


def test_http_invalid_refresh_clears_cookies(client):
    client.cookies.set("refresh_token", "invalid", domain="testserver.local")
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == 401
    assert "Max-Age=0" in res.headers["set-cookie"]


@pytest.mark.parametrize("path", ["login", "refresh", "logout"])
def test_auth_mutations_reject_untrusted_origin(client, path):
    assert (
        client.post(
            f"/api/v1/auth/{path}",
            headers={"Origin": "https://evil.example"},
            json={"email": "x", "password": "x"},
        ).status_code
        == 403
    )


def test_transient_http_error_keeps_cookies(client, auth):
    client.post(
        "/api/v1/auth/login", json={"email": "user@example.com", "password": "password"}
    )
    old = client.cookies.get("refresh_token")
    auth.manage.get_profile.side_effect = ServiceUnavailableException()
    res = client.post("/api/v1/auth/refresh")
    assert res.status_code == 503
    assert "set-cookie" not in res.headers
    assert client.cookies.get("refresh_token") == old


def test_business_api_routes_require_user_or_manage_authentication():
    import importlib
    import pkgutil

    from app.presentation.api import routers
    from fastapi.routing import APIRoute

    def auth_dependencies(dependant):
        for dep in dependant.dependencies:
            if getattr(dep.call, "__name__", "") in {
                "get_current_user",
                "require_manage_service",
            }:
                return True
            if auth_dependencies(dep):
                return True
        return False

    unprotected = []
    for module in pkgutil.iter_modules(routers.__path__):
        if module.name in {"auth", "health"}:
            continue
        router = importlib.import_module(f"{routers.__name__}.{module.name}").router
        for route in router.routes:
            if not isinstance(route, APIRoute) or route.path == "/me":
                continue  # /me validates its access token inside GetProfileUseCase.
            if not auth_dependencies(route.dependant):
                unprotected.append(route.path)
    assert not unprotected, f"Business endpoints without authentication: {unprotected}"
