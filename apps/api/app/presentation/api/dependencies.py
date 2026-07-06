"""
Dependency wrappers for compatibility with routers that still expect dict users.
"""

from typing import Annotated

from fastapi import Depends, HTTPException

from app.presentation.api.deps import UserContext
from app.presentation.api.deps import get_current_user as _get_current_user


async def get_current_user(
    user_ctx: Annotated[UserContext, Depends(_get_current_user)],
) -> dict:
    return {
        "user_id": user_ctx.id,
        "role_name": user_ctx.role_name,
        "quiz_role": user_ctx.quiz_role,
    }


async def require_admin(
    user: Annotated[UserContext, Depends(_get_current_user)],
) -> UserContext:
    if user.quiz_role != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")

    return user


CurrentUserDep = Annotated[dict, Depends(get_current_user)]
AdminDep = Annotated[UserContext, Depends(require_admin)]