from uuid import UUID

from worker_evaluate_homework.domain import (
    HomeworkRubric,
    IHomeworkArtifactReader,
    IHomeworkGradingEngine,
    IHomeworkGradingRepository,
    InvalidArtifactError,
    SubmissionGradingStatus,
)
from worker_evaluate_homework.domain.fingerprints import (
    build_fingerprint,
    find_plagiarism,
)

from .register_homework import RegisterHomeworkUseCase


class EvaluateHomeworkSubmissionUseCase:
    def __init__(
        self,
        repository: IHomeworkGradingRepository,
        artifact_reader: IHomeworkArtifactReader,
        grading_engine: IHomeworkGradingEngine,
        register_homework: RegisterHomeworkUseCase,
        plagiarism_threshold: float,
    ) -> None:
        self._repository = repository
        self._artifact_reader = artifact_reader
        self._grading_engine = grading_engine
        self._register_homework = register_homework
        self._plagiarism_threshold = plagiarism_threshold

    async def execute(
        self,
        submission_id: UUID,
        *,
        final_attempt: bool,
    ) -> float | None:
        try:
            submission = await self._repository.get_submission(submission_id)
            if submission is None:
                raise ValueError(f"Submission {submission_id} not found")
            if submission.status == SubmissionGradingStatus.GRADED.value:
                return submission.score

            await self._repository.set_submission_grading(submission_id)
            homework = await self._repository.get_homework(submission.homework_id)
            if homework is None:
                raise ValueError(f"Homework {submission.homework_id} not found")
            if homework.grading_rubric is None or not homework.grading_rubric.get(
                "criteria"
            ):
                await self._register_homework.execute(homework.id)
                homework = await self._repository.get_homework(homework.id)
                if (
                    homework is None
                    or homework.grading_rubric is None
                    or not homework.grading_rubric.get("criteria")
                ):
                    raise RuntimeError("Không thể tạo rubric cho bài tập")

            sources = await self._artifact_reader.read_submission_sources(
                submission.object_key
            )
            fingerprints = [build_fingerprint(source) for source in sources]
            previous = await self._repository.list_previous_fingerprints(
                submission.homework_id,
                submission.user_id,
                [value["file_name"] for value in fingerprints],
            )
            plagiarism, similarity, copied_user_id = find_plagiarism(
                fingerprints,
                previous,
            )
            result = await self._grading_engine.grade(
                HomeworkRubric.model_validate(homework.grading_rubric),
                sources,
            )
            await self._repository.replace_fingerprints(
                submission,
                fingerprints,
            )
            copied_user_id = (
                copied_user_id if similarity >= self._plagiarism_threshold else None
            )
            await self._repository.save_submission_result(
                submission_id,
                result,
                plagiarism,
                copied_user_id,
            )
            return result.score
        except InvalidArtifactError as exc:
            await self._repository.save_submission_error(
                submission_id,
                str(exc),
                final=True,
            )
            raise
        except Exception as exc:
            await self._repository.save_submission_error(
                submission_id,
                str(exc),
                final=final_attempt,
            )
            raise

