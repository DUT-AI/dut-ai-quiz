from typing import Any

from app.application.services.auth_roles import quiz_role_from_manage
from app.core.jwt import decode_access_token
from app.domain.interfaces import IManageService, IUserRepository
from app.infrastructure.cache.redis_client import ProfileCache
from loguru import logger


class GetProfileUseCase:
    def __init__(
        self,
        cache: ProfileCache,
        user_repo: IUserRepository,
        manage_client: IManageService,
    ) -> None:
        self._cache = cache
        self._user_repo = user_repo
        self._manage_client = manage_client

    async def execute(self, access_token: str | None) -> dict[str, Any] | None:
        if not access_token:
            return None

        # 1. Decode JWT Token
        payload = decode_access_token(access_token)
        if not payload:
            return None

        user_id = payload.get("user_id")
        user_type = payload.get("type", "service_a")

        if not user_id:
            return None

        # 2. Check Cache
        cached = await self._cache.get(access_token)
        if cached:
            return cached

        # 3. Fetch Profile
        if user_type == "google":
            # Fetch Google User from Local DB using UserRepository
            user = await self._user_repo.get_by_id(user_id)
            if not user:
                return None

            profile_data = {
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar_url": user.avatar_url,
                "role_names": [user.role],
                "quiz_role": user.role,
            }
            await self._cache.set(access_token, profile_data)
            return profile_data

        else:
            # Fetch Service A User via ManageServiceClient
            try:
                profile = await self._manage_client.get_profile(user_id)
                if not profile:
                    return None

                quiz_role = "guest"
                try:
                    quiz_role = quiz_role_from_manage(profile.role_names)
                except Exception:
                    pass

                profile_data = {
                    "id": profile.id,
                    "email": profile.email,
                    "name": profile.name,
                    "avatar_url": profile.avatar_url,
                    "role_names": profile.role_names,
                    "quiz_role": quiz_role,
                }

                # Store in Cache
                await self._cache.set(access_token, profile_data)
                return profile_data
            except Exception as e:
                logger.error(f"Error fetching profile from Manage Service: {e}")
                return None
