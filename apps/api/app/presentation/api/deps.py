from typing import Annotated

from dishka.integrations.fastapi import inject
from fastapi import Depends, HTTPException, Request
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


@inject
async def get_current_user(
    request: Request,
) -> UserContext:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        return UserContext(
            id=settings.auth_dev_user_id,
            role_name=rn,
            quiz_role=quiz_role_from_manage(rn),
        )

    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Unauthorized: No access token")

    payload = decode_access_token(access_token)
    if not payload:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")

    uid = payload.get("user_id")
    role = payload.get("role")

    if uid is None or role is None:
        raise HTTPException(
            status_code=401, detail="Unauthorized: Invalid token payload"
        )

    return UserContext(
        id=int(uid),
        role_name=role,
        quiz_role=role,
    )


def require_roles(*allowed_roles: str):
    async def dependency(
        user: Annotated[UserContext, Depends(get_current_user)]
    ) -> UserContext:
        if user.quiz_role not in allowed_roles:
            raise HTTPException(status_code=403, detail="Permission denied")
        return user
    return dependency


CurrentUser = Annotated[UserContext, Depends(get_current_user)]
AdminUser = Annotated[UserContext, Depends(require_roles("admin"))]
AdminOrMentorUser = Annotated[UserContext, Depends(require_roles("admin", "MENTOR"))]
# Keep these aliases temporarily to prevent syntax errors during migration
TeacherUser = AdminOrMentorUser
StudentUser = CurrentUser
