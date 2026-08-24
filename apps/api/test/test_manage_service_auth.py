import pytest
from app.config import settings
from app.presentation.api.deps import require_manage_service
from fastapi import HTTPException


@pytest.mark.asyncio
async def test_manage_service_accepts_configured_bearer_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "manage_api_key", "manage-secret")

    await require_manage_service("Bearer manage-secret")


@pytest.mark.asyncio
@pytest.mark.parametrize(
    "authorization",
    [None, "", "manage-secret", "Basic manage-secret", "Bearer wrong-secret"],
)
async def test_manage_service_rejects_invalid_credentials(
    monkeypatch: pytest.MonkeyPatch,
    authorization: str | None,
) -> None:
    monkeypatch.setattr(settings, "manage_api_key", "manage-secret")

    with pytest.raises(HTTPException) as exc_info:
        await require_manage_service(authorization)

    assert exc_info.value.status_code == 401


@pytest.mark.asyncio
async def test_manage_service_fails_closed_without_configured_key(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(settings, "manage_api_key", "")

    with pytest.raises(HTTPException) as exc_info:
        await require_manage_service("Bearer any-value")

    assert exc_info.value.status_code == 503
