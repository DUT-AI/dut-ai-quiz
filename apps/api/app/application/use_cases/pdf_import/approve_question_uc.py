"""ApproveQuestionUseCase — Step 8: Chuyển câu hỏi DRAFT → PUBLIC."""
from uuid import UUID

from app.infrastructure.persistence.models import Question
from redis.asyncio import Redis
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ApproveQuestionUseCase:
    def __init__(self, session: AsyncSession, redis: Redis) -> None:
        self._s = session
        self._redis = redis

    async def execute(
        self,
        question_id: UUID,
        admin_id: int,
        updated_content: str | None = None,
        updated_solution: str | None = None,
        updated_difficulty: str | None = None,
        updated_lesson_id: UUID | None = None,
    ) -> dict:
        """
        Approve DRAFT question → PUBLIC.
        Also releases Redis review lock if held by this admin.
        """
        r = await self._s.execute(
            select(Question).where(
                Question.id == question_id,
                Question.status == "DRAFT",
            )
        )
        model = r.scalar_one_or_none()
        if not model:
            return {"ok": False, "error": "Câu hỏi không tồn tại hoặc không ở trạng thái DRAFT"}

        # Check lock: only the lock holder can approve
        lock_key = f"lock:question:{question_id}"
        lock_holder = await self._redis.get(lock_key)
        if lock_holder and int(lock_holder) != admin_id:
            return {
                "ok": False,
                "error": f"Câu hỏi đang được admin #{lock_holder} review. Vui lòng đợi.",
            }

        # Apply optional edits
        if updated_content is not None:
            model.content = updated_content
        if updated_solution is not None:
            model.solution = updated_solution
        if updated_difficulty is not None:
            model.difficulty = updated_difficulty
        if updated_lesson_id is not None:
            model.lesson_id = updated_lesson_id

        model.status = "PUBLIC"
        model.review_locked_by = None
        model.review_locked_at = None

        await self._s.flush()

        # Release Redis lock
        await self._redis.delete(lock_key)

        return {"ok": True, "question_id": str(question_id), "status": "PUBLIC"}
