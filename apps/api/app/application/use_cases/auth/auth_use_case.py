from pydantic import BaseModel
from loguru import logger

from app.infrastructure.cache.redis_client import ProfileCache
from app.domain.entities.user import UserEntity
from app.core.jwt import create_access_token
from app.application.services.auth_roles import quiz_role_from_manage
from app.infrastructure.clients import GoogleOAuthClient, ManageServiceClient
from app.infrastructure.repositories.users import UserRepository


class LoginPayload(BaseModel):
    email: str
    password: str


class AuthTokens(BaseModel):
    access_token: str
    refresh_token: str


class ProxyLoginUseCase:
    def __init__(self, manage_client: ManageServiceClient) -> None:
        self._manage_client = manage_client

    async def execute(self, payload: LoginPayload) -> AuthTokens | None:
        try:
            # 1. Login to Manage Service
            body = await self._manage_client.login(payload.model_dump())
            if not body or not body.get("is_success", False):
                return None

            data = body.get("data")
            if not data or "access_token" not in data:
                logger.error(f"Invalid data structure from Manage API: {data}")
                return None

            manage_access_token = data["access_token"]

            # 2. Get Profile from Manage Service to fetch actual user ID and role
            profile_body = await self._manage_client.get_own_profile(
                manage_access_token
            )
            if not profile_body or not profile_body.get("is_success", True):
                return None

            profile_data = profile_body.get("data")
            if profile_data is None:
                return None

            manage_user_id = int(profile_data["id"])
            rn = str(profile_data.get("role_name") or "")

            quiz_role = quiz_role_from_manage(rn)

            # 3. Create unified JWT token
            local_jwt = create_access_token(
                {"user_id": manage_user_id, "role": quiz_role, "type": "service_a"}
            )

            return AuthTokens(
                access_token=local_jwt,
                refresh_token="",
            )
        except Exception as e:
            logger.exception(f"Unexpected error during proxy login: {e}")
            return None


class GoogleAuthUseCase:
    def __init__(
        self,
        user_repo: UserRepository,
        google_client: GoogleOAuthClient,
        manage_client: ManageServiceClient,
    ) -> None:
        self._user_repo = user_repo
        self._google_client = google_client
        self._manage_client = manage_client

    async def execute(self, code: str) -> AuthTokens | None:
        try:
            # 1. Exchange OAuth code for Google Access Token
            google_access_token = await self._google_client.exchange_code(code)
            if not google_access_token:
                return None

            # 2. Get User Info from Google
            google_user = await self._google_client.get_user_info(google_access_token)
            if not google_user:
                return None

            email = google_user.get("email")
            name = google_user.get("name") or google_user.get(
                "given_name", "Google User"
            )
            picture = google_user.get("picture")
            sub = google_user.get("sub")  # Unique Google ID

            if not email:
                logger.error("Google account has no email associated")
                return None

            # 3. Check if email exists in Manage Service (for Account Linking)
            service_a_user_id = None
            service_a_role = "student"

            logger.info(f"Checking email {email} on Manage Service")
            body = await self._manage_client.find_user_by_email(email)
            if body:
                users_list = []
                if isinstance(body, list):
                    users_list = body
                elif isinstance(body, dict):
                    users_list = body.get("data") or body.get("users") or []

                for u in users_list:
                    if u.get("email") == email:
                        service_a_user_id = int(u["id"])
                        rn = str(u.get("role_name") or "")
                        try:
                            service_a_role = quiz_role_from_manage(rn)
                        except ValueError:
                            service_a_role = "student"
                        break

            # 4. Handle linking or creation
            if service_a_user_id is not None:
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
            else:
                # Google-only user -> check / create locally
                logger.info(f"Google-only user {email}. Checking local DB.")
                db_user = await self._user_repo.get_by_email(email)

                if not db_user:
                    logger.info(f"Creating new Google-only user locally: {email}")
                    db_user = UserEntity(
                        email=email,
                        role="student",
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
        except Exception as e:
            logger.exception(f"Unexpected error during Google login: {e}")
            return None


class LogoutUseCase:
    def __init__(self, cache: ProfileCache) -> None:
        self._cache = cache

    async def execute(self, access_token: str | None) -> None:
        if access_token:
            # Invalidate cache on logout
            await self._cache.delete(access_token)
