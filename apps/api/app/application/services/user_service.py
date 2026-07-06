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
