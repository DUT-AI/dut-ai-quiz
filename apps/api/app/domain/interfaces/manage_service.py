from abc import ABC, abstractmethod

from app.domain.entities.manage_service import (
    ManageAuthTokens,
    ManageTeamEntity,
    ManageUserEntity,
    ManageUserProfile,
)


class IManageService(ABC):
    @abstractmethod
    async def get_teams(self) -> list[ManageTeamEntity]:
        """Lấy danh sách các đội dưới dạng thực thể."""
        pass

    @abstractmethod
    async def get_users(self) -> list[ManageUserEntity]:
        """Lấy danh sách người dùng dưới dạng thực thể."""
        pass

    @abstractmethod
    async def login(self, payload_dict: dict) -> ManageAuthTokens | None:
        """Đăng nhập vào hệ thống Manage Service ngoài."""
        pass

    @abstractmethod
    async def get_own_profile(
        self, dut_ai_user_access_token: str
    ) -> ManageUserProfile | None:
        """Lấy thông tin profile cá nhân bằng access token."""
        pass

    @abstractmethod
    async def get_profile(self, user_id: int) -> ManageUserProfile | None:
        """Lấy thông tin profile của một user theo ID dưới dạng thực thể."""
        pass

    @abstractmethod
    async def find_user_by_email(self, email: str) -> list[ManageUserProfile]:
        """Tìm kiếm thông tin user qua email dưới dạng thực thể."""
        pass
