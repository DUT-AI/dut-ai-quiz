from uuid import UUID
from redis.asyncio import Redis
from app.domain.interfaces.question_repo import IQuestionRepository

class HeartbeatQuestionUseCase:
    def __init__(self, redis: Redis, question_repo: IQuestionRepository):
        self.redis = redis
        self.question_repo = question_repo

    async def execute(self, question_id: UUID, admin_id: int) -> bool:
        # Check if question exists and is DRAFT
        q = await self.question_repo.get(question_id)
        if not q or q.status != "DRAFT":
            return False

        lock_key = f"lock:question:{question_id}"
        current_lock = await self.redis.get(lock_key)
        
        # If someone else holds the lock, fail
        if current_lock and current_lock != str(admin_id):
            return False

        # Set or renew the lock for 60 seconds
        await self.redis.setex(lock_key, 60, str(admin_id))
        return True
