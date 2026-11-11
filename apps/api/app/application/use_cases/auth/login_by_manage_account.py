from app.application.dtos import AuthTokens, LoginPayload
from app.application.services.auth_sessions import AuthSessionService
from app.config import settings
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IManageService
from loguru import logger


class LoginByManageAccountUseCase:
    def __init__(
        self, manage_client: IManageService, sessions: AuthSessionService
    ) -> None:
        self._manage_client = manage_client
        self._sessions = sessions

    async def execute(self, payload: LoginPayload) -> AuthTokens:
        if settings.auth_dev_bypass:
            rn = settings.auth_dev_role_name
            roles = [rn] if isinstance(rn, str) else (rn or ["admin"])
            return await self._sessions.create(
                settings.auth_dev_user_id, "MANAGE", roles
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
                raise AppException(
                    "Không thể tải thông tin cá nhân từ hệ thống quản lý", 400
                )

            manage_user_id = profile.id
            role_names = profile.role_names

            # 3. Create unified JWT token
            return await self._sessions.create(
                manage_user_id, "MANAGE", role_names or ["guest"]
            )
        except AppException:
            raise
        except Exception as e:
            logger.exception(f"Unexpected error during proxy login: {e}")
            raise AppException(f"Đăng nhập thất bại: {str(e)}", 500) from e
