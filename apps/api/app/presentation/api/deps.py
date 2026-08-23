from hmac import compare_digest
from typing import Annotated

from dishka.integrations.fastapi import inject
from fastapi import Depends, Header, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.core.jwt import decode_access_token
from app.infrastructure.database import get_session


class UserContext(BaseModel):
    id: int
    roles: list[str] = []

    def has_any_role(self, *allowed_roles: str) -> bool:
        return any(r in allowed_roles for r in self.roles)


SessionDep = Annotated[AsyncSession, Depends(get_session)]


@inject
async def get_current_user(
    request: Request,
) -> UserContext:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        roles = [rn] if isinstance(rn, str) else (rn or [])
        return UserContext(
            id=settings.auth_dev_user_id,
            roles=roles,
        )

    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Unauthorized: No access token")

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


def require_roles(*allowed_roles: str):
    async def dependency(
        user: Annotated[UserContext, Depends(get_current_user)]
    ) -> UserContext:
        if not any(r in allowed_roles for r in user.roles):
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
AdminUser = Annotated[UserContext, Depends(require_roles("admin"))]
AdminOrMentorUser = Annotated[UserContext, Depends(require_roles("admin", "MENTOR"))]
# Keep these aliases temporarily to prevent syntax errors during migration
TeacherUser = AdminOrMentorUser
StudentUser = CurrentUser
ManageService = Annotated[None, Depends(require_manage_service)]
