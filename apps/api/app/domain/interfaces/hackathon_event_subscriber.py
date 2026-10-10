from collections.abc import AsyncIterator
from typing import Protocol


class IHackathonEventSubscriber(Protocol):
    def subscribe_submission_events(self) -> AsyncIterator[dict | None]:
        """Lắng nghe các sự kiện nộp bài. Yield None khi timeout (để heartbeat)."""
        ...
