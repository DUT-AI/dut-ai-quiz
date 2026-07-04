from app.domain.exceptions.exceptions import AppException
from app.domain.entities.manage_service import ManageUserProfile
from app.application.dtos import AuthTokens
from app.application.services.auth_roles import quiz_role_from_manage
from app.core.jwt import create_access_token
from app.domain.entities.user import UserEntity
from app.domain.interfaces import IManageService, IUserRepository
from app.infrastructure.clients import GoogleOAuthClient
from loguru import logger


class GoogleAuthUseCase:
    def __init__(
        self,
        user_repo: IUserRepository,
        google_client: GoogleOAuthClient,
        manage_client: IManageService,
    ) -> None:
        self._user_repo = user_repo
        self._google_client = google_client
        self._manage_client = manage_client

    async def handle_login_by_google_email_guest(self, google_user: dict[str, str]):
        email = google_user.get("email")
        name = google_user.get("name") or google_user.get("given_name", "Google User")
        picture = google_user.get("picture")
        sub = google_user.get("sub")  # Unique Google ID

        db_user = await self._user_repo.get_by_email(email)

        if not db_user:
            logger.info(f"Creating new Google-only user locally: {email}")
            db_user = UserEntity(
                email=email,
                role="guest",
                google_id=sub,
                name=name,
                avatar_url=picture,
            )
            db_user = await self._user_repo.add(db_user)
        else:
            if picture and db_user.avatar_url != picture:
                db_user.avatar_url = picture
                await self._user_repo.update(db_user)

        local_jwt = create_access_token(
            {"user_id": db_user.id, "role": db_user.role, "type": "google"}
        )

        return AuthTokens(
            access_token=local_jwt,
            refresh_token="",
        )

    def handle_login_by_manage_email(
        self, user_profiles: list[ManageUserProfile], email: str
    ) -> AuthTokens:
        for u in user_profiles:
            if u.email == email:
                service_a_user_id = int(u.id)
                role_names = u.role_names
                try:
                    service_a_role = quiz_role_from_manage(role_names)
                except Exception:
                    service_a_role = "guest"

                # User exists in Service A -> Generate JWT linked to Service A ID directly (No DB row needed)
                logger.info(
                    f"Linking Google user {email} to Service A user ID: {service_a_user_id}"
                )
                local_jwt = create_access_token(
                    {
                        "user_id": service_a_user_id,
                        "role": service_a_role,
                        "type": "service_a",
                    }
                )
                return AuthTokens(
                    access_token=local_jwt,
                    refresh_token="",
                )
        raise AppException(
            "Không tìm thấy thông tin email khớp với hệ thống quản lý", 400
        )

    async def execute(self, code: str) -> AuthTokens:
        try:
            # 1. Exchange OAuth code for Google Access Token
            google_access_token = await self._google_client.exchange_code(code)
            if not google_access_token:
                raise AppException(
                    "Không thể lấy Google Access Token từ OAuth code", 400
                )

            # 2. Get User Info from Google
            google_user = await self._google_client.get_user_info(google_access_token)
            if not google_user:
                raise AppException("Không thể lấy thông tin người dùng từ Google", 400)

            email = google_user.get("email")

            if not email:
                logger.error("Google account has no email associated")
                raise AppException("Tài khoản Google không có email liên kết", 400)

            # 3. Check if email exists in Manage Service (for Account Linking)
            logger.info(f"Checking email {email} on Manage Service")
            user_profiles = await self._manage_client.find_user_by_email(email)
            if user_profiles:
                return self.handle_login_by_manage_email(user_profiles, email)

            # Google-only user -> check / create locally
            logger.info(f"Google-only user {email}. Checking local DB.")
            return await self.handle_login_by_google_email_guest(google_user)

        except AppException:
            raise
        except Exception as e:
            logger.exception(f"Unexpected error during Google login: {e}")
            raise AppException(f"Đăng nhập Google thất bại: {str(e)}", 500) from e
