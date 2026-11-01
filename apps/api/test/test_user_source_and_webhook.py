from datetime import datetime
from unittest.mock import AsyncMock, patch

import pytest
from app.core.jwt import create_access_token
from app.domain.entities.homework import SubmissionType
from app.domain.entities.user import UserEntity, UserSource
from app.infrastructure.services.manage_webhook import (
    _send_webhook_request,
)
from app.presentation.api.deps import UserContext, extract_auth_context_from_request
from fastapi import Request


def test_user_entity_user_source():
    manage_user = UserEntity(
        id=10,
        email="student@dutai.site",
        role="student",
        google_id="gid1",
        user_source=UserSource.MANAGE,
    )
    assert manage_user.is_manage_user is True
    assert manage_user.user_source == UserSource.MANAGE

    google_user = UserEntity(
        id=20,
        email="guest@gmail.com",
        role="guest",
        google_id="gid2",
        user_source=UserSource.GOOGLE,
    )
    assert google_user.is_manage_user is False
    assert google_user.user_source == UserSource.GOOGLE


def test_user_context_user_source():
    ctx_manage = UserContext(id=1, roles=["STUDENT"], user_source=UserSource.MANAGE)
    assert ctx_manage.is_manage_user is True

    ctx_internal = UserContext(id=1, roles=["GUEST"], user_source=UserSource.INTERNAL)
    assert ctx_internal.is_manage_user is False


def test_jwt_user_source_extraction(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "auth_dev_bypass", False)

    # Manage JWT
    token_manage = create_access_token(
        {"user_id": 9999999, "roles": ["STUDENT"], "user_source": "MANAGE"}
    )
    scope = {
        "type": "http",
        "headers": [(b"authorization", f"Bearer {token_manage}".encode())],
        "query_string": b"",
    }
    req = Request(scope)
    ctx = extract_auth_context_from_request(req)
    assert ctx is not None
    assert ctx.id == 9999999
    assert ctx.user_source == UserSource.MANAGE
    assert ctx.is_manage_user is True

    # Google/Internal JWT
    token_google = create_access_token(
        {"user_id": 10, "roles": ["GUEST"], "user_source": "GOOGLE"}
    )
    scope_g = {
        "type": "http",
        "headers": [(b"authorization", f"Bearer {token_google}".encode())],
        "query_string": b"",
    }
    req_g = Request(scope_g)
    ctx_g = extract_auth_context_from_request(req_g)
    assert ctx_g is not None
    assert ctx_g.id == 10
    assert ctx_g.user_source == UserSource.INTERNAL
    assert ctx_g.is_manage_user is False


@pytest.mark.asyncio
async def test_webhook_skipped_for_non_manage_user_even_with_low_id():
    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        await _send_webhook_request(
            lesson_slug="test-lesson",
            user_id=5,  # Low ID, but non-manage
            submission_type=SubmissionType.CODING,
            submitted_at=datetime.utcnow(),
            user_source=UserSource.INTERNAL,
        )
        mock_post.assert_not_called()


@pytest.mark.asyncio
async def test_webhook_sent_for_manage_user_even_with_high_id(monkeypatch):
    from app.config import settings

    monkeypatch.setattr(settings, "manage_base_url", "https://manage.dutai.site")
    monkeypatch.setattr(settings, "manage_webhook_secret", "secret")

    with patch("httpx.AsyncClient.post", new_callable=AsyncMock) as mock_post:
        mock_post.return_value.status_code = 200

        await _send_webhook_request(
            lesson_slug="test-lesson",
            user_id=2_500_000,  # High ID, but explicitly MANAGE source
            submission_type=SubmissionType.CODING,
            submitted_at=datetime.utcnow(),
            user_source=UserSource.MANAGE,
        )
        mock_post.assert_called_once()
        call_args = mock_post.call_args
        assert call_args.kwargs["json"]["user_id"] == 2_500_000
