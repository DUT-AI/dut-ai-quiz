from fastapi import Request

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.infrastructure.auth_manage.client import fetch_me


async def execute(request: Request) -> dict:
    if settings.auth_dev_bypass:
        rn = settings.auth_dev_role_name
        return {
            "id": settings.auth_dev_user_id,
            "role_name": rn,
            "quiz_role": quiz_role_from_manage(rn),
            "email": "dev@local",
            "name": "Dev User",
        }
    raw = await fetch_me(request.headers.get("cookie"))
    role_names = raw.get("role_names") or raw.get("role_name") or []
    out = {k: v for k, v in raw.items()}
    out["quiz_role"] = quiz_role_from_manage(role_names)
    return out
