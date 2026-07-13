from typing import Protocol
from uuid import UUID

class IHackathonLeaderboardCache(Protocol):
    async def get(self, hackathon_id: UUID, is_private: bool = False) -> list[dict] | None:
        """Lấy bảng xếp hạng từ cache."""
        ...

    async def set(self, hackathon_id: UUID, leaderboard: list[dict], is_private: bool = False) -> None:
        """Lưu bảng xếp hạng vào cache."""
        ...
