from typing import Annotated

from fastapi import Depends, HTTPException, Request, Security
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.core.jwt import decode_access_token
from app.infrastructure.database import get_session


class UserContext(BaseModel):
    id: int
    role_name: str
    quiz_role: str


SessionDep = Annotated[AsyncSession, Depends(get_session)]

bearer_scheme = HTTPBearer(auto_error=False)


def _token_from_request(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None,
) -> str | None:
    if credentials and credentials.scheme.lower() == "bearer":
        return credentials.credentials

    return request.cookies.get("access_token")


def _user_from_token(access_token: str) -> UserContext:
    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")

    uid = payload.get("user_id")
    role = payload.get("role")

    if uid is None or role is None:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid token payload",
        )

    quiz_role = quiz_role_from_manage(role)

    if isinstance(role, list):
        role_name = ",".join(str(item) for item in role)
    else:
        role_name = str(role)

    return UserContext(
        id=int(uid),
        role_name=role_name,
        quiz_role=quiz_role,
    )


async def get_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> UserContext:
    if settings.auth_dev_bypass:
        role_name = settings.auth_dev_role_name
        return UserContext(
            id=settings.auth_dev_user_id,
            role_name=role_name,
            quiz_role=quiz_role_from_manage(role_name),
        )

    access_token = _token_from_request(request, credentials)
    if not access_token:
        raise HTTPException(status_code=401, detail="Unauthorized: No access token")

    return _user_from_token(access_token)


async def get_optional_current_user(
    request: Request,
    credentials: HTTPAuthorizationCredentials | None = Security(bearer_scheme),
) -> UserContext | None:
    if settings.auth_dev_bypass:
        role_name = settings.auth_dev_role_name
        return UserContext(
            id=settings.auth_dev_user_id,
            role_name=role_name,
            quiz_role=quiz_role_from_manage(role_name),
        )

    access_token = _token_from_request(request, credentials)
    if not access_token:
        return None

    return _user_from_token(access_token)


def require_roles(*allowed_roles: str):
    allowed = set(allowed_roles)

    async def dependency(
        user: Annotated[UserContext, Depends(get_current_user)]
    ) -> UserContext:
        if user.quiz_role not in allowed:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user

    return dependency


CurrentUser = Annotated[UserContext, Depends(get_current_user)]
OptionalCurrentUser = Annotated[UserContext | None, Depends(get_optional_current_user)]

AdminUser = Annotated[UserContext, Depends(require_roles("admin"))]
AdminOrMentorUser = Annotated[UserContext, Depends(require_roles("admin", "MENTOR"))]

TeacherUser = AdminOrMentorUser
StudentUser = CurrentUser