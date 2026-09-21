from uuid import UUID

from app.domain.entities.question import QuestionEntity
from app.domain.interfaces.question_repo import IQuestionRepository
from redis.asyncio import Redis


class PublishQuestionUseCase:
    def __init__(self, redis: Redis, question_repo: IQuestionRepository):
        self.redis = redis
        self.question_repo = question_repo

    async def execute(self, question_id: UUID, admin_id: int) -> QuestionEntity | None:
        q = await self.question_repo.get(question_id)
        if not q or q.status != "DRAFT":
            return None

        # Optionally check if lock is held by someone else
        lock_key = f"lock:question:{question_id}"
        current_lock = await self.redis.get(lock_key)
        if current_lock and current_lock != str(admin_id):
            raise ValueError("Question is currently locked by another admin")

        q.status = "PUBLIC"
        await self.question_repo.update(q)

        # Release the lock
        await self.redis.delete(lock_key)

        return q
