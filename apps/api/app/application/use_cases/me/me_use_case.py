from typing import Any

from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.core.jwt import decode_access_token
from app.domain.exceptions.exceptions import AppException
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

    async def execute(self, access_token: str | None) -> dict[str, Any]:
        if settings.auth_dev_bypass:
            rn = settings.auth_dev_role_name
            roles = [rn] if isinstance(rn, str) else (rn or ["admin"])
            return {
                "id": settings.auth_dev_user_id,
                "email": "dev@dutai.site",
                "name": f"Dev User ({roles[0]})",
                "avatar_url": None,
                "role_names": roles,
                "quiz_role": quiz_role_from_manage(roles),
            }

        if not access_token:
            raise AppException("Không tìm thấy access token trong cookie", 401)

        # 1. Decode JWT Token
        payload = decode_access_token(access_token)
        if not payload:
            raise AppException("Access token không hợp lệ hoặc đã hết hạn", 401)

        user_id = payload.get("user_id")
        user_type = payload.get("type", "service_a")

        if not user_id:
            raise AppException("Token payload không hợp lệ (thiếu user_id)", 401)

        # 2. Check Cache
        cached = await self._cache.get(access_token)
        if cached:
            return cached

        # 3. Fetch Profile
        if user_type == "google":
            # Fetch Google User from Local DB using UserRepository
            user = await self._user_repo.get_by_id(user_id)
            if not user:
                raise AppException(
                    f"Không tìm thấy người dùng Google với ID {user_id} trong cơ sở dữ liệu local",
                    401,
                )

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
            roles_in_payload = payload.get("roles")
            try:
                profile = await self._manage_client.get_profile(user_id)
                if not profile:
                    if roles_in_payload and isinstance(roles_in_payload, list):
                        quiz_role = quiz_role_from_manage(roles_in_payload)
                        return {
                            "id": user_id,
                            "email": payload.get("email", f"user{user_id}@dutai.site"),
                            "name": payload.get("name", f"User #{user_id}"),
                            "avatar_url": payload.get("avatar_url"),
                            "role_names": roles_in_payload,
                            "quiz_role": quiz_role,
                        }
                    raise AppException(
                        f"Không tìm thấy thông tin tài khoản Manage Service với ID {user_id}",
                        401,
                    )

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
            except AppException:
                raise
            except Exception as e:
                logger.error(f"Error fetching profile from Manage Service: {e}")
                if roles_in_payload and isinstance(roles_in_payload, list):
                    quiz_role = quiz_role_from_manage(roles_in_payload)
                    return {
                        "id": user_id,
                        "email": payload.get("email", f"user{user_id}@dutai.site"),
                        "name": payload.get("name", f"User #{user_id}"),
                        "avatar_url": payload.get("avatar_url"),
                        "role_names": roles_in_payload,
                        "quiz_role": quiz_role,
                    }
                raise AppException(
                    f"Lỗi khi lấy thông tin tài khoản từ Manage Service: {str(e)}", 401
                ) from e
