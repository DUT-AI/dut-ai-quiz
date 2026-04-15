from typing import Annotated

from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.infrastructure.auth_manage.client import fetch_me
from app.infrastructure.database import get_session


class UserContext(BaseModel):
    id: int
    role_name: str
    quiz_role: str


SessionDep = Annotated[AsyncSession, Depends(get_session)]


async def get_current_user(request: Request) -> UserContext:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        return UserContext(id=settings.auth_dev_user_id, role_name=rn, quiz_role=quiz_role_from_manage(rn))
    try:
        raw = await fetch_me(request.headers.get("cookie"))
    except Exception as e:
        raise HTTPException(status_code=401, detail="Unauthorized") from e
    rn = str(raw.get("role_name") or "")
    try:
        qr = quiz_role_from_manage(rn)
    except ValueError as e:
        raise HTTPException(status_code=403, detail="Forbidden role") from e
    return UserContext(id=int(raw["id"]), role_name=rn, quiz_role=qr)


async def require_teacher(user: UserContext = Depends(get_current_user)) -> UserContext:
    if user.quiz_role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher only")
    return user


async def require_student(user: UserContext = Depends(get_current_user)) -> UserContext:
    if user.quiz_role != "student":
        raise HTTPException(status_code=403, detail="Student only")
    return user


CurrentUser = Annotated[UserContext, Depends(get_current_user)]
TeacherUser = Annotated[UserContext, Depends(require_teacher)]
StudentUser = Annotated[UserContext, Depends(require_student)]
