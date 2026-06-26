from __future__ import annotations

from dataclasses import dataclass
from datetime import datetime, timedelta
from uuid import UUID, uuid4

from app.application.use_cases.hackathon.ports import (
    CompetitionRepository,
    SubmissionRepository,
    TaskRepository,
)
from app.core.datetime_utils import now_ict
from app.domain.hackathon.exceptions import (
    CompetitionNotFoundError,
    HackathonCooldownError,
    HackathonQuotaExceededError,
    SubmissionNotCancelableError,
    SubmissionNotFoundError,
    TaskNotFoundError,
)
from app.domain.hackathon.models import (
    CompetitionEntity,
    CompetitionParticipationMode,
    LeaderboardEntryEntity,
    MetricType,
    SubmissionEntity,
    SubmissionStage,
    TaskEntity,
)
from app.domain.hackathon.ranking import build_leaderboard


@dataclass
class CreateCompetitionPayload:
    name: str
    description: str
    rules: str
    start_at: datetime | None = None
    end_at: datetime | None = None
    participation_mode: CompetitionParticipationMode = CompetitionParticipationMode.both
    max_submissions_per_participant: int = 5
    cooldown_minutes: int = 5
    is_published: bool = False


@dataclass
class CreateTaskPayload:
    name: str
    description_md: str
    sample_dataset_url: str
    private_test_url: str
    public_test_url: str
    metric_type: MetricType
    max_submissions: int = 5


@dataclass
class CreateSubmissionPayload:
    participant_name: str
    script_filename: str
    model_filename: str


@dataclass
class RecordSubmissionResultPayload:
    score: float
    inference_time_ms: int
    error_log: list[str] | None = None
    failed: bool = False


class CreateCompetitionUseCase:
    def __init__(self, competition_repo: CompetitionRepository) -> None:
        self._competition_repo = competition_repo

    async def execute(self, payload: CreateCompetitionPayload, created_by: int) -> CompetitionEntity:
        entity = CompetitionEntity(
            id=uuid4(),
            name=payload.name,
            description=payload.description,
            rules=payload.rules,
            start_at=payload.start_at,
            end_at=payload.end_at,
            participation_mode=payload.participation_mode,
            max_submissions_per_participant=payload.max_submissions_per_participant,
            cooldown_minutes=payload.cooldown_minutes,
            is_published=payload.is_published,
            created_by=created_by,
        )
        return await self._competition_repo.add(entity)


class ListCompetitionsUseCase:
    def __init__(self, competition_repo: CompetitionRepository) -> None:
        self._competition_repo = competition_repo

    async def execute(self) -> list[CompetitionEntity]:
        return await self._competition_repo.list_all()


class CreateTaskUseCase:
    def __init__(self, competition_repo: CompetitionRepository, task_repo: TaskRepository) -> None:
        self._competition_repo = competition_repo
        self._task_repo = task_repo

    async def execute(
        self,
        competition_id: UUID,
        payload: CreateTaskPayload,
        created_by: int,
    ) -> TaskEntity:
        competition = await self._competition_repo.get(competition_id)
        if not competition:
            raise CompetitionNotFoundError()

        entity = TaskEntity(
            id=uuid4(),
            competition_id=competition_id,
            name=payload.name,
            description_md=payload.description_md,
            sample_dataset_url=payload.sample_dataset_url,
            private_test_url=payload.private_test_url,
            public_test_url=payload.public_test_url,
            metric_type=payload.metric_type,
            max_submissions=payload.max_submissions,
            created_by=created_by,
        )
        return await self._task_repo.add(entity)


class ListTasksUseCase:
    def __init__(self, task_repo: TaskRepository) -> None:
        self._task_repo = task_repo

    async def execute(self, competition_id: UUID) -> list[TaskEntity]:
        return await self._task_repo.list_by_competition(competition_id)


class SubmitHackathonSolutionUseCase:
    def __init__(
        self,
        competition_repo: CompetitionRepository,
        task_repo: TaskRepository,
        submission_repo: SubmissionRepository,
    ) -> None:
        self._competition_repo = competition_repo
        self._task_repo = task_repo
        self._submission_repo = submission_repo

    async def execute(
        self,
        competition_id: UUID,
        task_id: UUID,
        participant_id: int,
        payload: CreateSubmissionPayload,
    ) -> SubmissionEntity:
        competition = await self._competition_repo.get(competition_id)
        if not competition:
            raise CompetitionNotFoundError()

        if not competition.is_open():
            raise CompetitionNotFoundError()

        task = await self._task_repo.get(task_id)
        if not task or task.competition_id != competition_id:
            raise TaskNotFoundError()

        completed_count = await self._submission_repo.count_successful_by_participant(
            competition_id, participant_id
        )
        if completed_count >= competition.max_submissions_per_participant:
            raise HackathonQuotaExceededError()

        last_successful = await self._submission_repo.latest_successful_by_participant(
            competition_id, participant_id
        )
        if last_successful and last_successful.finished_at:
            deadline = last_successful.finished_at + timedelta(minutes=competition.cooldown_minutes)
            if now_ict() < deadline:
                raise HackathonCooldownError()

        entity = SubmissionEntity(
            id=uuid4(),
            competition_id=competition_id,
            task_id=task_id,
            participant_id=participant_id,
            participant_name=payload.participant_name,
            script_filename=payload.script_filename,
            model_filename=payload.model_filename,
            stage=SubmissionStage.uploading,
        )
        return await self._submission_repo.add(entity)


class CancelSubmissionUseCase:
    def __init__(self, submission_repo: SubmissionRepository) -> None:
        self._submission_repo = submission_repo

    async def execute(self, submission_id: UUID) -> SubmissionEntity:
        submission = await self._submission_repo.get(submission_id)
        if not submission:
            raise SubmissionNotFoundError()
        if not submission.is_cancelable():
            raise SubmissionNotCancelableError()
        submission.mark_canceled()
        return await self._submission_repo.update(submission)


class RecordSubmissionResultUseCase:
    def __init__(self, submission_repo: SubmissionRepository) -> None:
        self._submission_repo = submission_repo

    async def execute(
        self,
        submission_id: UUID,
        payload: RecordSubmissionResultPayload,
    ) -> SubmissionEntity:
        submission = await self._submission_repo.get(submission_id)
        if not submission:
            raise SubmissionNotFoundError()

        if payload.failed:
            submission.mark_failed(payload.error_log or [])
        else:
            submission.mark_completed(
                score=payload.score,
                inference_time_ms=payload.inference_time_ms,
            )
        return await self._submission_repo.update(submission)


class GetCompetitionLeaderboardUseCase:
    def __init__(
        self,
        competition_repo: CompetitionRepository,
        task_repo: TaskRepository,
        submission_repo: SubmissionRepository,
    ) -> None:
        self._competition_repo = competition_repo
        self._task_repo = task_repo
        self._submission_repo = submission_repo

    async def execute(self, competition_id: UUID) -> list[LeaderboardEntryEntity]:
        competition = await self._competition_repo.get(competition_id)
        if not competition:
            raise CompetitionNotFoundError()
        tasks = await self._task_repo.list_by_competition(competition_id)
        submissions = await self._submission_repo.list_by_competition(competition_id)
        return build_leaderboard(competition, tasks, submissions)
