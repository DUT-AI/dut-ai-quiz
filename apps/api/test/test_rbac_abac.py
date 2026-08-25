from datetime import datetime
from unittest.mock import AsyncMock
from uuid import uuid4

import pytest
from fastapi import HTTPException

from app.application.use_cases.hackathon.crud_hackathon import (
    DeleteHackathonUseCase,
    UpdateHackathonUseCase,
)
from app.domain.entities.auth_enums import (
    ROLE_DEFAULT_PERMISSIONS,
    SystemPermission,
    UserRole,
    normalize_role,
    resolve_permissions_for_roles,
)
from app.domain.entities.hackathon import HackathonEntity
from app.infrastructure.persistence.models.auth_rbac import (
    Permission,
    Role,
    role_permissions,
    user_roles,
)
from app.infrastructure.persistence.models.user import User
from app.presentation.api.abac import is_resource_owner, verify_resource_ownership
from app.core.jwt import create_access_token
from app.config import settings
from app.presentation.api.deps import (
    RequirePermissions,
    UserContext,
    extract_auth_context_from_request,
    get_current_user,
    get_optional_current_user,
)
from app.presentation.schemas.hackathons import HackathonUpdate


# ============================================================================
# 1. ENUMS & MULTI-ROLE ADDITIVE PERMISSION TESTS
# ============================================================================


def test_user_roles_and_permissions_defined():
    assert UserRole.ADMIN == "ADMIN"
    assert UserRole.EDUCATOR == "EDUCATOR"
    assert UserRole.PROJECT_DEVELOPER == "PROJECT_DEVELOPER"
    assert UserRole.SUB_ADMIN == "SUB_ADMIN"
    assert UserRole.TEAMMATE == "TEAMMATE"

    assert SystemPermission.MANAGE_HACKATHON == "MANAGE_HACKATHON"
    assert SystemPermission.CREATE_LESSON == "CREATE_LESSON"
    assert SystemPermission.ATTEMPT_EXAM == "ATTEMPT_EXAM"


def test_teammate_permissions():
    perms = ROLE_DEFAULT_PERMISSIONS[UserRole.TEAMMATE]
    assert SystemPermission.READ_LESSON in perms
    assert SystemPermission.ATTEMPT_EXAM in perms
    assert SystemPermission.SUBMIT_HOMEWORK in perms
    assert SystemPermission.MANAGE_HACKATHON not in perms
    assert SystemPermission.CREATE_LESSON not in perms


def test_educator_permissions_inheritance():
    perms = ROLE_DEFAULT_PERMISSIONS[UserRole.EDUCATOR]
    # Inherits Teammate
    assert SystemPermission.READ_LESSON in perms
    assert SystemPermission.ATTEMPT_EXAM in perms
    # Educator specifics
    assert SystemPermission.CREATE_LESSON in perms
    assert SystemPermission.MANAGE_LESSON in perms
    assert SystemPermission.MANAGE_HOMEWORK in perms
    # Should not have hackathon management
    assert SystemPermission.MANAGE_HACKATHON not in perms


def test_project_developer_permissions_inheritance():
    perms = ROLE_DEFAULT_PERMISSIONS[UserRole.PROJECT_DEVELOPER]
    # Inherits Teammate
    assert SystemPermission.READ_LESSON in perms
    assert SystemPermission.SUBMIT_HACKATHON_TASK in perms
    # Project Dev specifics
    assert SystemPermission.APPROVE_TEAM_REGISTRATION in perms
    assert SystemPermission.MANAGE_HACKATHON in perms
    assert SystemPermission.MANAGE_HACKATHON_TASK in perms
    # Should not have lesson creation
    assert SystemPermission.CREATE_LESSON not in perms


def test_sub_admin_permissions_inheritance():
    perms = ROLE_DEFAULT_PERMISSIONS[UserRole.SUB_ADMIN]
    assert SystemPermission.MANAGE_HACKATHON in perms
    assert SystemPermission.MANAGE_EXAM in perms
    assert SystemPermission.CREATE_LESSON not in perms


def test_multi_role_additive_permissions():
    # User with both EDUCATOR and PROJECT_DEVELOPER roles
    resolved = resolve_permissions_for_roles(["EDUCATOR", "PROJECT_DEVELOPER"])
    # Should have Educator permissions
    assert SystemPermission.CREATE_LESSON.value in resolved
    assert SystemPermission.MANAGE_HOMEWORK.value in resolved
    # Should also have Project Developer permissions
    assert SystemPermission.MANAGE_HACKATHON.value in resolved
    assert SystemPermission.APPROVE_TEAM_REGISTRATION.value in resolved
    # Should also have Teammate permissions
    assert SystemPermission.READ_LESSON.value in resolved


def test_admin_role_resolves_all_permissions():
    resolved = resolve_permissions_for_roles(["ADMIN"])
    for p in SystemPermission:
        assert p.value in resolved


# ============================================================================
# 2. RBAC FASTAPI DEPENDENCY TESTS (RequirePermissions & Admin Override)
# ============================================================================


@pytest.mark.asyncio
async def test_require_permissions_success_single_role():
    user = UserContext(id=1, roles=["PROJECT_DEVELOPER"])
    dep = RequirePermissions([SystemPermission.MANAGE_HACKATHON])
    res = await dep(user)
    assert res == user


@pytest.mark.asyncio
async def test_require_permissions_success_additive_multi_roles():
    # User holds EDUCATOR + TEAMMATE, checking CREATE_LESSON
    user = UserContext(id=1, roles=["EDUCATOR", "TEAMMATE"])
    dep = RequirePermissions([SystemPermission.CREATE_LESSON])
    res = await dep(user)
    assert res == user


@pytest.mark.asyncio
async def test_require_permissions_denied():
    # Teammate trying to manage hackathon
    user = UserContext(id=1, roles=["TEAMMATE"])
    dep = RequirePermissions([SystemPermission.MANAGE_HACKATHON])
    with pytest.raises(HTTPException) as exc_info:
        await dep(user)
    assert exc_info.value.status_code == 403
    assert "Forbidden: Insufficient permissions" in exc_info.value.detail


@pytest.mark.asyncio
async def test_require_permissions_admin_global_override():
    # Admin bypasses any permission check, even if not explicitly defined
    user = UserContext(id=99, roles=["ADMIN"])
    assert user.is_admin() is True
    dep = RequirePermissions(["SOME_CUSTOM_RESTRICTED_PERMISSION"])
    res = await dep(user)
    assert res == user


# ============================================================================
# 3. ABAC (OWNERSHIP) TESTS
# ============================================================================


def test_abac_ownership_checker():
    creator_user = UserContext(id=10, roles=["PROJECT_DEVELOPER"])
    other_user = UserContext(id=20, roles=["PROJECT_DEVELOPER"])
    admin_user = UserContext(id=99, roles=["ADMIN"])

    # Creator owns the resource
    assert is_resource_owner(10, creator_user) is True
    verify_resource_ownership(10, creator_user, "Hackathon")  # Does not raise

    # Other user does NOT own resource
    assert is_resource_owner(10, other_user) is False
    with pytest.raises(HTTPException) as exc_info:
        verify_resource_ownership(10, other_user, "Hackathon")
    assert exc_info.value.status_code == 403

    # Admin bypasses ownership
    assert is_resource_owner(10, admin_user) is True
    verify_resource_ownership(10, admin_user, "Hackathon")  # Does not raise


@pytest.mark.asyncio
async def test_update_hackathon_abac_logic():
    hackathon_id = uuid4()
    mock_repo = AsyncMock()
    mock_hackathon = HackathonEntity(
        id=hackathon_id,
        name="AI Hackathon 2026",
        description="DUT AI Hackathon",
        rules="Rules",
        start_time=None,
        end_time=None,
        participation_mode="both",
        max_team_members=5,
        created_by=10,  # Created by user 10
        created_at=datetime.now(),
    )
    mock_repo.get.return_value = mock_hackathon
    mock_repo.update.side_effect = lambda entity: entity

    use_case = UpdateHackathonUseCase(mock_repo)

    # 1. Creator (user_id=10) updates -> Success
    res = await use_case.execute(
        hackathon_id=hackathon_id,
        payload=HackathonUpdate(name="Updated Hackathon Name"),
        user_id=10,
        is_admin=False,
    )
    assert res is not None
    assert res.name == "Updated Hackathon Name"

    # 2. Non-owner (user_id=20) updates -> 403 Forbidden
    with pytest.raises(HTTPException) as exc_info:
        await use_case.execute(
            hackathon_id=hackathon_id,
            payload=HackathonUpdate(name="Hacked Name"),
            user_id=20,
            is_admin=False,
        )
    assert exc_info.value.status_code == 403
    assert "Ownership required" in exc_info.value.detail

    # 3. Admin (user_id=99, is_admin=True) updates non-owned hackathon -> Success (Bypass)
    res_admin = await use_case.execute(
        hackathon_id=hackathon_id,
        payload=HackathonUpdate(name="Admin Modified Name"),
        user_id=99,
        is_admin=True,
    )
    assert res_admin is not None
    assert res_admin.name == "Admin Modified Name"


@pytest.mark.asyncio
async def test_delete_hackathon_abac_logic():
    hackathon_id = uuid4()
    mock_repo = AsyncMock()
    mock_hackathon = HackathonEntity(
        id=hackathon_id,
        name="Hackathon To Delete",
        description="",
        rules="",
        start_time=None,
        end_time=None,
        participation_mode="both",
        max_team_members=5,
        created_by=10,
        created_at=datetime.now(),
    )
    mock_repo.get.return_value = mock_hackathon
    mock_repo.delete.return_value = None

    use_case = DeleteHackathonUseCase(mock_repo)

    # Non-owner fails
    with pytest.raises(HTTPException) as exc_info:
        await use_case.execute(hackathon_id=hackathon_id, user_id=20, is_admin=False)
    assert exc_info.value.status_code == 403

    # Owner succeeds
    ok = await use_case.execute(hackathon_id=hackathon_id, user_id=10, is_admin=False)
    assert ok is True

    # Admin succeeds
    ok_admin = await use_case.execute(
        hackathon_id=hackathon_id, user_id=99, is_admin=True
    )
    assert ok_admin is True


# ============================================================================
# 4. SQLALCHEMY RBAC MODEL TESTS
# ============================================================================


def test_sqlalchemy_model_mappings():
    assert Role.__tablename__ == "roles"
    assert Permission.__tablename__ == "permissions"
    assert user_roles.name == "user_roles"
    assert role_permissions.name == "role_permissions"
    assert User.__tablename__ == "users"

    # Verify relationships are mapped
    assert hasattr(User, "roles")
    assert hasattr(Role, "permissions")
    assert hasattr(Role, "users")
    assert hasattr(Permission, "roles")


# ============================================================================
# 5. 3RD-PARTY ACCESS TOKEN & OPTIONAL PUBLIC AUTH TESTS
# ============================================================================


class DummyRequest:
    def __init__(
        self,
        headers: dict[str, str] | None = None,
        cookies: dict[str, str] | None = None,
        query_params: dict[str, str] | None = None,
    ):
        self.headers = headers or {}
        self.cookies = cookies or {}
        self.query_params = query_params or {}


@pytest.mark.asyncio
async def test_extract_auth_context_bearer_token(monkeypatch):
    monkeypatch.setattr(settings, "auth_dev_bypass", False)
    token = create_access_token({"user_id": 42, "roles": ["PROJECT_DEVELOPER"]})

    # 1. Bearer in Authorization header
    req = DummyRequest(headers={"Authorization": f"Bearer {token}"})
    ctx = await get_current_user(req)
    assert ctx.id == 42
    assert "PROJECT_DEVELOPER" in ctx.roles
    assert ctx.has_permission(SystemPermission.MANAGE_HACKATHON)


@pytest.mark.asyncio
async def test_extract_auth_context_api_key(monkeypatch):
    monkeypatch.setattr(settings, "auth_dev_bypass", False)
    monkeypatch.setattr(settings, "third_party_api_keys", "secret-test-key, partner-key-123")

    # Header X-API-Key
    req = DummyRequest(headers={"X-API-Key": "secret-test-key"})
    ctx = await get_current_user(req)
    assert ctx.id == 0
    assert "THIRD_PARTY" in ctx.roles
    assert ctx.has_permission(SystemPermission.READ_LESSON)

    # Invalid API Key raises 401
    invalid_req = DummyRequest(headers={"X-API-Key": "wrong-key"})
    with pytest.raises(HTTPException) as exc:
        await get_current_user(invalid_req)
    assert exc.value.status_code == 401


@pytest.mark.asyncio
async def test_get_optional_current_user_unauthenticated(monkeypatch):
    monkeypatch.setattr(settings, "auth_dev_bypass", False)

    # Anonymous request without any credentials
    req = DummyRequest()
    ctx = await get_optional_current_user(req)
    assert ctx is None


@pytest.mark.asyncio
async def test_get_current_user_unauthenticated_raises_401(monkeypatch):
    monkeypatch.setattr(settings, "auth_dev_bypass", False)

    # Unauthenticated request for protected endpoints
    req = DummyRequest()
    with pytest.raises(HTTPException) as exc:
        await get_current_user(req)
    assert exc.value.status_code == 401

