from uuid import UUID

from worker_evaluate_homework.domain import (
    IHomeworkArtifactReader,
    IHomeworkGradingEngine,
    IHomeworkGradingRepository,
)


class RegisterHomeworkUseCase:
    def __init__(
        self,
        repository: IHomeworkGradingRepository,
        artifact_reader: IHomeworkArtifactReader,
        grading_engine: IHomeworkGradingEngine,
    ) -> None:
        self._repository = repository
        self._artifact_reader = artifact_reader
        self._grading_engine = grading_engine

    async def execute(self, homework_id: UUID) -> None:
        try:
            homework = await self._repository.get_homework(homework_id)
            if homework is None:
                raise ValueError(f"Homework {homework_id} not found")
            await self._repository.set_homework_processing(homework_id)
            attachment_text = await self._artifact_reader.read_homework_text(
                homework.attachment_key
            )
            rubric = await self._grading_engine.create_rubric(
                homework,
                attachment_text,
            )
            await self._repository.save_homework_rubric(
                homework_id,
                rubric.model_dump(mode="json"),
            )
        except Exception as exc:
            await self._repository.save_homework_error(
                homework_id,
                str(exc),
            )
            raise
