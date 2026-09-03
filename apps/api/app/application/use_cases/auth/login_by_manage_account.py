from app.application.dtos import AuthTokens, LoginPayload
from app.application.services.auth_roles import quiz_role_from_manage
from app.config import settings
from app.core.jwt import create_access_token
from app.domain.interfaces import IManageService
from app.domain.exceptions.exceptions import AppException
from loguru import logger


class LoginByManageAccountUseCase:
    def __init__(self, manage_client: IManageService) -> None:
        self._manage_client = manage_client

    async def execute(self, payload: LoginPayload) -> AuthTokens:
        if settings.auth_dev_bypass:
            rn = settings.auth_dev_role_name
            roles = [rn] if isinstance(rn, str) else (rn or ["admin"])
            local_jwt = create_access_token(
                {
                    "user_id": settings.auth_dev_user_id,
                    "roles": roles,
                    "type": "service_a",
                }
            )
            return AuthTokens(
                access_token=local_jwt,
                refresh_token="",
            )

        try:
            # 1. Login to Manage Service
            tokens = await self._manage_client.login(payload.model_dump())
            if not tokens or not tokens.access_token:
                raise AppException("Tên đăng nhập hoặc mật khẩu không chính xác", 400)

            # 2. Get Profile from Manage Service to fetch actual user ID and role
            manage_access_token = tokens.access_token
            profile = await self._manage_client.get_own_profile(manage_access_token)
            if not profile:
                raise AppException("Không thể tải thông tin cá nhân từ hệ thống quản lý", 400)

            manage_user_id = profile.id
            role_names = profile.role_names

            # 3. Create unified JWT token
            local_jwt = create_access_token(
                {"user_id": manage_user_id, "roles": role_names or ["guest"], "type": "service_a"}
            )

            return AuthTokens(
                access_token=local_jwt,
                refresh_token="",
            )
        except AppException:
            raise
        except Exception as e:
            logger.exception(f"Unexpected error during proxy login: {e}")
            raise AppException(f"Đăng nhập thất bại: {str(e)}", 500) from e