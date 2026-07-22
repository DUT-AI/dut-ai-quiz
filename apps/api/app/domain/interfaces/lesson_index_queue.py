from typing import Protocol
from uuid import UUID


class ILessonIndexQueue(Protocol):
    async def enqueue_index(self, lesson_id: UUID, source_hash: str) -> None:
        """Schedule a versioned lesson indexing job."""
        ...
