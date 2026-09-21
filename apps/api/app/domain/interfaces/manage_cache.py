from typing import Protocol

from app.domain.entities.manage_service import ManageTeamEntity, ManageUserEntity


class IDUTAIManageCache(Protocol):
    """Interface protocol for caching external DUT AI Manage Service responses."""

    async def get_teams(self) -> list[ManageTeamEntity] | None:
        """Lấy danh sách teams thực thể từ cache."""
        ...

    async def set_teams(self, data: list[ManageTeamEntity]) -> None:
        """Lưu danh sách teams thực thể vào cache."""
        ...

    async def get_users(self) -> list[ManageUserEntity] | None:
        """Lấy danh sách users thực thể từ cache."""
        ...

    async def set_users(self, data: list[ManageUserEntity]) -> None:
        """Lưu danh sách users thực thể vào cache."""
        ...
