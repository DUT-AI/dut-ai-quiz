from uuid import UUID, uuid4

from app.application.services.question_embedding import QuestionEmbeddingService
from app.application.use_cases.attempts.rescore_use_case import RescoreAttemptUseCase
from app.domain.entities.question import QuestionEntity, QuestionOptionEntity
from app.domain.interfaces import IAttemptRepository, IQuestionRepository
from app.presentation.schemas.questions import (
    QuestionUpdate,
)


class UpdateQuestionUseCase:
    def __init__(
        self,
        question_repo: IQuestionRepository,
        att_repo: IAttemptRepository,
        rescore_use_case: RescoreAttemptUseCase,
        question_embedding: QuestionEmbeddingService,
    ):
        self._question_repo = question_repo
        self._att_repo = att_repo
        self._rescore_use_case = rescore_use_case
        self._question_embedding = question_embedding

    async def execute(self, question_id: UUID, payload: QuestionUpdate) -> QuestionEntity | None:
        entity = await self._question_repo.get(question_id)
        if not entity:
            return None

        data = payload.model_dump(exclude_unset=True)
        for k, v in data.items():
            if k == "options" and v is not None:
                options = [
                    QuestionOptionEntity(
                        id=opt.get("id") or str(uuid4()).split("-")[0],
                        text=opt.get("text", ""),
                        is_correct=opt.get("is_correct", False),
                        fixed=opt.get("fixed", False),
                    )
                    for opt in v
                ]
                setattr(entity, k, options)
            else:
                setattr(entity, k, v)

        if entity.embedding is None or {"content", "options"} & data.keys():
            await self._question_embedding.prepare(entity)

        updated = await self._question_repo.update(entity)
        if updated:
            # Trigger re-scoring for all affected attempts
            attempt_ids = await self._att_repo.list_completed_ids_by_question_id(question_id)
            if attempt_ids:
                for aid in attempt_ids:
                    await self._rescore_use_case.execute(attempt_id=aid)

        return updated
