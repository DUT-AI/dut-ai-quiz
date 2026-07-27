"""RegenerateSolutionUseCase — AI sinh lại lời giải cho một câu hỏi."""
from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.services.pdf_ai_parser import PDFAIParserService
from app.infrastructure.persistence.models import Question


class RegenerateSolutionUseCase:
    def __init__(self, session: AsyncSession, ai_parser: PDFAIParserService) -> None:
        self._s = session
        self._ai = ai_parser

    async def execute(
        self,
        question_id: UUID,
        admin_hint: str = "",
    ) -> dict:
        """Call Gemini to regenerate solution for a specific question."""
        r = await self._s.execute(
            select(Question).where(Question.id == question_id)
        )
        model = r.scalar_one_or_none()
        if not model:
            return {"ok": False, "error": "Câu hỏi không tồn tại"}

        options_dicts = [dict(opt) for opt in (model.options or [])]

        try:
            new_solution = await self._ai.regenerate_solution(
                content=model.content,
                options=options_dicts,
                admin_hint=admin_hint,
            )
            model.solution = new_solution
            model.is_solution_ai_generated = True
            await self._s.flush()

            return {
                "ok": True,
                "question_id": str(question_id),
                "solution": new_solution,
            }
        except RuntimeError as exc:
            return {"ok": False, "error": str(exc)}
