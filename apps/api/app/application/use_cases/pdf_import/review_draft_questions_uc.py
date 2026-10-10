"""ReviewDraftQuestionsUseCase — List DRAFT questions of an import session."""

from uuid import UUID

from app.infrastructure.persistence.models import Question
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession


class ReviewDraftQuestionsUseCase:
    def __init__(self, session: AsyncSession) -> None:
        self._s = session

    async def execute(
        self,
        import_session_id: UUID,
        offset: int = 0,
        limit: int = 50,
    ) -> list[dict]:
        """List DRAFT questions for a specific import session."""
        stmt = (
            select(Question)
            .where(
                Question.import_session_id == import_session_id,
                Question.status == "DRAFT",
            )
            .order_by(Question.created_at.asc())
            .offset(offset)
            .limit(limit)
        )
        result = await self._s.execute(stmt)
        models = result.scalars().all()

        questions = []
        for m in models:
            entity = m.to_entity()
            questions.append(
                {
                    "id": str(entity.id),
                    "content": entity.content,
                    "options": [opt.to_dict() for opt in entity.options],
                    "solution": entity.solution,
                    "difficulty": entity.difficulty,
                    "status": entity.status,
                    "is_answer_ai_generated": entity.is_answer_ai_generated,
                    "is_solution_ai_generated": entity.is_solution_ai_generated,
                    "is_difficulty_ai_suggested": entity.is_difficulty_ai_suggested,
                    "duplicate_status": entity.duplicate_status,
                    "duplicate_of_question_id": (
                        str(entity.duplicate_of_question_id)
                        if entity.duplicate_of_question_id
                        else None
                    ),
                    "review_locked_by": entity.review_locked_by,
                    "lesson_id": str(entity.lesson_id) if entity.lesson_id else None,
                    "created_at": entity.created_at.isoformat(),
                }
            )
        return questions
