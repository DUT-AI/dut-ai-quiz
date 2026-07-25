from app.application.dtos.user import UserOut
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import IUserRepository, IManageService


class UserService:
    def __init__(self, user_repo: IUserRepository, manage_client: IManageService):
        self.user_repo = user_repo
        self.manage_client = manage_client

    async def get_user_info(self, user_id: int) -> UserOut:
        """Lấy thông tin user từ local DB (Google) hoặc Manage Service (Service-A)."""
        u = await self.user_repo.get_by_id(user_id)
        if u:
            return UserOut(
                id=u.id or 0,
                name=u.name or u.email,
                email=u.email,
                avatar_url=u.avatar_url,
            )

        # Fallback: lấy từ Manage Service
        profile = await self.manage_client.get_profile(user_id)
        if profile:
            return UserOut(
                id=user_id,
                name=profile.name,
                email=profile.email,
                avatar_url=profile.avatar_url,
            )

        raise AppException(
            message=f"Không tìm thấy thông tin của user {user_id}",
            status_code=404,
        )

    async def ensure_user_exists(self, user_id: int) -> None:
        """Đảm bảo user tồn tại trong local database (cần cho các bảng có FK users.id)."""
        u = await self.user_repo.get_by_id(user_id)
        if u:
            return

        profile = await self.manage_client.get_profile(user_id)
        if profile:
            from app.domain.entities.user import UserEntity
            from app.application.services.auth_roles import quiz_role_from_manage
            
            quiz_role = "guest"
            try:
                quiz_role = quiz_role_from_manage(profile.role_names)
            except Exception:
                pass
                
            new_user = UserEntity(
                id=user_id,
                email=profile.email,
                role=quiz_role,
                google_id="",
                name=profile.name,
                avatar_url=profile.avatar_url,
            )
            await self.user_repo.add(new_user)
