import os
from uuid import UUID

from app.config import settings
from app.domain.entities.question import QuestionEntity
from app.domain.interfaces.question_repo import IQuestionRepository
from google import genai


class AiRegenerateSolutionUseCase:
    def __init__(self, question_repo: IQuestionRepository):
        self.question_repo = question_repo

    async def execute(self, question_id: UUID, custom_prompt: str | None = None) -> QuestionEntity | None:
        q = await self.question_repo.get(question_id)
        if not q or q.status != "DRAFT":
            return None

        api_key = settings.gemini_api_key or os.environ.get("GEMINI_API_KEY")
        if not api_key:
            raise ValueError("GEMINI_API_KEY is missing")

        client = genai.Client(api_key=api_key)
        prompt = (
            f"Solve the following multiple-choice question step-by-step.\n"
            f"Question:\n{q.content}\n"
        )
        if custom_prompt:
            prompt += f"\nAdditional Instructions from Teacher:\n{custom_prompt}\n"

        response = client.models.generate_content(
            model="gemma-4-31b-it",
            contents=prompt
        )

        q.solution = response.text
        q.is_solution_ai_generated = True

        await self.question_repo.update(q)
        return q
