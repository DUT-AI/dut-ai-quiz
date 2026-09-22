import pytest
from app.presentation.api.deps import UserContext, require_roles
from fastapi import HTTPException


def test_user_context_roles_defaults():
    # Verify UserContext initializes roles to empty list if not specified
    user = UserContext(id=1)
    assert user.roles == []


def test_user_context_has_any_role():
    user = UserContext(id=1, roles=["teammate", "MENTOR"])
    assert user.has_any_role("admin", "MENTOR") is True
    assert user.has_any_role("admin") is False
    assert user.has_any_role("teammate") is True


@pytest.mark.asyncio
async def test_require_roles_success():
    # User has teammate and MENTOR roles
    user = UserContext(id=1, roles=["teammate", "MENTOR"])

    # API requires admin or MENTOR
    dependency = require_roles("admin", "MENTOR")
    res = await dependency(user)
    assert res == user


@pytest.mark.asyncio
async def test_require_roles_denied():
    # User has only teammate
    user = UserContext(id=1, roles=["teammate"])

    # API requires admin or MENTOR
    dependency = require_roles("admin", "MENTOR")
    with pytest.raises(HTTPException) as exc_info:
        await dependency(user)
    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Permission denied"
