"""
Use cases for Hackathon Submission management
"""
from datetime import datetime
from uuid import UUID, uuid4

from app.domain.entities.submission import HackathonSubmissionEntity
from app.domain.value_objects.enums import SubmissionStatus
from app.infrastructure.repositories.submissions import HackathonSubmissionRepository
from app.infrastructure.repositories.runtime_profiles import RuntimeProfileRepository
from app.infrastructure.repositories.hackathons import HackathonTaskRepository


class CreateSubmissionUseCase:
    def __init__(
        self,
        submission_repo: HackathonSubmissionRepository,
        profile_repo: RuntimeProfileRepository,
        task_repo: HackathonTaskRepository,
    ):
        self.submission_repo = submission_repo
        self.profile_repo = profile_repo
        self.task_repo = task_repo

    async def execute(
        self,
        task_id: UUID,
        runtime_profile_id: UUID,
        script_s3_key: str,
        user_id: int | None = None,
        team_id: UUID | None = None,
        model_s3_key: str | None = None,
    ) -> HackathonSubmissionEntity:
        """
        Create a new submission with runtime profile validation.
        Validates:
        - Runtime profile exists and is active
        - Task exists
        - Max submissions not exceeded
        """
        # Validate runtime profile exists and is active
        profile = await self.profile_repo.get(runtime_profile_id)
        if not profile:
            raise ValueError(f"Runtime profile {runtime_profile_id} not found")
        
        profile.validate_active()  # Raises if not active

        # Validate task exists
        task = await self.task_repo.get(task_id)
        if not task:
            raise ValueError(f"Task {task_id} not found")

        # Check max submissions limit
        if user_id:
            count = await self.submission_repo.count_by_user(task_id, user_id)
        elif team_id:
            count = await self.submission_repo.count_by_team(task_id, team_id)
        else:
            raise ValueError("Either user_id or team_id must be provided")

        if count >= task.max_submissions:
            raise ValueError(
                f"Maximum submission limit ({task.max_submissions}) exceeded"
            )

        # Create submission entity
        entity = HackathonSubmissionEntity(
            id=uuid4(),
            task_id=task_id,
            user_id=user_id,
            team_id=team_id,
            runtime_profile_id=runtime_profile_id,
            script_s3_key=script_s3_key,
            model_s3_key=model_s3_key,
            status=SubmissionStatus.PENDING,
            score=None,
            execution_log=None,
            error_message=None,
            submitted_at=datetime.utcnow(),
        )

        return await self.submission_repo.add(entity)


class GetSubmissionUseCase:
    def __init__(self, repo: HackathonSubmissionRepository):
        self.repo = repo

    async def execute(self, submission_id: UUID) -> HackathonSubmissionEntity:
        """Get a submission by ID."""
        entity = await self.repo.get(submission_id)
        if not entity:
            raise ValueError(f"Submission {submission_id} not found")
        return entity


class ListSubmissionsUseCase:
    def __init__(self, repo: HackathonSubmissionRepository):
        self.repo = repo

    async def execute(
        self,
        task_id: UUID,
        user_id: int | None = None,
        team_id: UUID | None = None,
    ) -> list[HackathonSubmissionEntity]:
        """List submissions for a task, optionally filtered by user/team."""
        if user_id:
            return await self.repo.list_by_user(task_id, user_id)
        elif team_id:
            return await self.repo.list_by_team(task_id, team_id)
        else:
            return await self.repo.list_by_task(task_id)


class GetBestSubmissionUseCase:
    def __init__(self, repo: HackathonSubmissionRepository):
        self.repo = repo

    async def execute(
        self,
        task_id: UUID,
        user_id: int | None = None,
        team_id: UUID | None = None,
    ) -> HackathonSubmissionEntity | None:
        """Get the best (highest score) submission for leaderboard."""
        return await self.repo.get_best_submission(task_id, user_id, team_id)


class UpdateSubmissionStatusUseCase:
    def __init__(self, repo: HackathonSubmissionRepository):
        self.repo = repo

    async def execute_running(self, submission_id: UUID) -> HackathonSubmissionEntity:
        """Mark submission as running (called by worker)."""
        entity = await self.repo.get(submission_id)
        if not entity:
            raise ValueError(f"Submission {submission_id} not found")

        entity.mark_running()
        return await self.repo.update(entity)

    async def execute_completed(
        self, submission_id: UUID, score: float, log: str
    ) -> HackathonSubmissionEntity:
        """Mark submission as completed with score (called by worker)."""
        entity = await self.repo.get(submission_id)
        if not entity:
            raise ValueError(f"Submission {submission_id} not found")

        entity.mark_completed(score, log)
        return await self.repo.update(entity)

    async def execute_failed(
        self, submission_id: UUID, error: str, log: str | None = None
    ) -> HackathonSubmissionEntity:
        """Mark submission as failed (called by worker)."""
        entity = await self.repo.get(submission_id)
        if not entity:
            raise ValueError(f"Submission {submission_id} not found")

        entity.mark_failed(error, log)
        return await self.repo.update(entity)

    async def execute_timeout(
        self, submission_id: UUID, log: str | None = None
    ) -> HackathonSubmissionEntity:
        """Mark submission as timeout (called by worker)."""
        entity = await self.repo.get(submission_id)
        if not entity:
            raise ValueError(f"Submission {submission_id} not found")

        entity.mark_timeout(log)
        return await self.repo.update(entity)
