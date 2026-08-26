from hmac import compare_digest
from typing import Annotated, Any, Sequence

from dishka.integrations.fastapi import inject
from fastapi import Depends, Header, HTTPException, Request
from pydantic import BaseModel, Field
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.jwt import decode_access_token
from app.domain.entities.auth_enums import (
    SystemPermission,
    UserRole,
    normalize_role,
    resolve_permissions_for_roles,
)
from app.infrastructure.database import get_session


class UserContext(BaseModel):
    id: int
    roles: list[str] = Field(default_factory=list)
    permissions: set[str] = Field(default_factory=set)

    def model_post_init(self, __context: Any) -> None:
        if not self.permissions and self.roles:
            self.permissions = resolve_permissions_for_roles(self.roles)

    def has_any_role(self, *allowed_roles: str | UserRole) -> bool:
        allowed_set = {
            r.value.lower() if isinstance(r, UserRole) else str(r).strip().lower()
            for r in allowed_roles
        }
        for r in self.roles:
            norm = normalize_role(r)
            if norm and norm.value.lower() in allowed_set:
                return True
            if str(r).strip().lower() in allowed_set:
                return True
        return False

    def is_admin(self) -> bool:
        for r in self.roles:
            if normalize_role(r) == UserRole.ADMIN or str(r).strip().lower() == "admin":
                return True
        return False

    def has_permission(self, *required_permissions: SystemPermission | str) -> bool:
        if self.is_admin():
            return True
        check_perms = {
            p.value if isinstance(p, SystemPermission) else str(p)
            for p in required_permissions
        }
        return bool(self.permissions & check_perms)


SessionDep = Annotated[AsyncSession, Depends(get_session)]


def extract_auth_context_from_request(request: Request) -> UserContext | None:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        roles = [rn] if isinstance(rn, str) else (rn or [])
        return UserContext(
            id=settings.auth_dev_user_id,
            roles=roles,
        )

    # 1. Check API Key for third-party integrations
    api_key = request.headers.get("X-API-Key") or request.query_params.get("api_key")
    if api_key:
        if api_key in settings.third_party_api_key_list:
            return UserContext(
                id=0,
                roles=["THIRD_PARTY", UserRole.TEAMMATE.value],
            )
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid API Key")

    # 2. Check Authorization Header (Bearer token)
    access_token = None
    auth_header = request.headers.get("Authorization")
    if auth_header and auth_header.strip().startswith("Bearer "):
        access_token = auth_header.strip().split(" ", 1)[1].strip()

    # 3. Check Cookie
    if not access_token:
        access_token = request.cookies.get("access_token")

    if not access_token:
        return None

    # 4. Decode JWT Token
    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")

    uid = payload.get("user_id")
    roles = payload.get("roles")

    if uid is None or roles is None or not isinstance(roles, list):
        raise HTTPException(
            status_code=401, detail="Unauthorized: Invalid token payload"
        )

    return UserContext(
        id=int(uid),
        roles=roles,
    )


@inject
async def get_current_user(
    request: Request,
) -> UserContext:
    user = extract_auth_context_from_request(request)
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized: No access token or API key provided")
    return user


@inject
async def get_optional_current_user(
    request: Request,
) -> UserContext | None:
    return extract_auth_context_from_request(request)


def RequirePermissions(
    required_permissions: Sequence[SystemPermission | str],
    require_all: bool = False,
):
    """
    FastAPI RBAC Dependency to enforce permission access.
    - Global Override: ADMIN role automatically bypasses all checks.
    - Multi-role aggregation: combines permissions from all user roles.
    - require_all: True to require all permissions, False (default) to require at least one.
    """
    req_list = [
        p.value if isinstance(p, SystemPermission) else str(p)
        for p in required_permissions
    ]

    async def dependency(
        user: Annotated[UserContext, Depends(get_current_user)],
    ) -> UserContext:
        if user.is_admin():
            return user

        if require_all:
            satisfied = all(p in user.permissions for p in req_list)
        else:
            satisfied = any(p in user.permissions for p in req_list)

        if not satisfied:
            raise HTTPException(
                status_code=403,
                detail=f"Forbidden: Insufficient permissions. Required: {req_list}",
            )
        return user

    return dependency


def require_roles(*allowed_roles: str | UserRole):
    allowed_list = [
        r.value if isinstance(r, UserRole) else str(r) for r in allowed_roles
    ]

    async def dependency(
        user: Annotated[UserContext, Depends(get_current_user)],
    ) -> UserContext:
        if user.is_admin():
            return user
        if not user.has_any_role(*allowed_list):
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return dependency


async def require_manage_service(
    authorization: Annotated[str | None, Header()] = None,
) -> None:
    expected_key = settings.manage_api_key.strip()
    if not expected_key:
        raise HTTPException(
            status_code=503,
            detail="Manage integration is not configured",
        )

    scheme, separator, credential = (authorization or "").partition(" ")
    if (
        not separator
        or scheme.casefold() != "bearer"
        or not compare_digest(credential, expected_key)
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid Manage service credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


CurrentUser = Annotated[UserContext, Depends(get_current_user)]
AdminUser = Annotated[UserContext, Depends(require_roles(UserRole.ADMIN, "admin"))]
EducatorUser = Annotated[
    UserContext,
    Depends(
        require_roles(
            UserRole.ADMIN, UserRole.EDUCATOR, "admin", "EDUCATOR", "educator"
        )
    ),
]
AdminOrEducatorUser = EducatorUser
TeacherUser = EducatorUser
ProjectDevUser = Annotated[
    UserContext,
    Depends(
        require_roles(
            UserRole.ADMIN,
            UserRole.SUB_ADMIN,
            UserRole.PROJECT_DEVELOPER,
            "admin",
            "PROJECT_DEVELOPER",
        )
    ),
]
StudentUser = CurrentUser
OptionalCurrentUser = Annotated[UserContext | None, Depends(get_optional_current_user)]
ManageService = Annotated[None, Depends(require_manage_service)]
