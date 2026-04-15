from typing import Annotated

from fastapi import Depends, HTTPException, Request
from pydantic import BaseModel
from sqlalchemy.ext.asyncio import AsyncSession
from dishka.integrations.fastapi import FromDishka, inject

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.infrastructure.database import get_session
from app.application.use_cases.me.me_use_case import GetProfileUseCase

class UserContext(BaseModel):
    id: int
    role_name: str
    quiz_role: str

SessionDep = Annotated[AsyncSession, Depends(get_session)]

@inject
async def get_current_user(
    request: Request,
    get_profile: FromDishka[GetProfileUseCase]
) -> UserContext:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        return UserContext(id=settings.auth_dev_user_id, role_name=rn, quiz_role=quiz_role_from_manage(rn))
    
    access_token = request.cookies.get("access_token")
    if not access_token:
        raise HTTPException(status_code=401, detail="Unauthorized: No access token")
        
    data = await get_profile.execute(access_token)
    if not data:
        raise HTTPException(status_code=401, detail="Unauthorized: Invalid session")
        
    return UserContext(
        id=int(data["id"]), 
        role_name=str(data.get("role_name", "")), 
        quiz_role=str(data.get("quiz_role", "guest"))
    )


async def require_teacher(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
    if user.quiz_role != "teacher":
        raise HTTPException(status_code=403, detail="Teacher only")
    return user


async def require_student(user: Annotated[UserContext, Depends(get_current_user)]) -> UserContext:
    if user.quiz_role != "student":
        raise HTTPException(status_code=403, detail="Student only")
    return user


CurrentUser = Annotated[UserContext, Depends(get_current_user)]
TeacherUser = Annotated[UserContext, Depends(require_teacher)]
StudentUser = Annotated[UserContext, Depends(require_student)]
