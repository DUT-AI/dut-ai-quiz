from datetime import datetime
from uuid import UUID

from app.application.services.user_service import UserService
from app.domain.entities.hackathon import RegistrationStatus
from app.domain.entities.submission import HackathonSubmissionEntity, SubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
    ISubmissionQueue,
)


class SubmitTaskUseCase:
    def __init__(
        self,
        hackathon_repo: IHackathonRepository,
        task_repo: IHackathonTaskRepository,
        team_repo: IHackathonTeamRepository,
        reg_repo: IHackathonRegistrationRepository,
        sub_repo: IHackathonSubmissionRepository,
        submission_queue: ISubmissionQueue,
        user_service: UserService,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo
        self._sub_repo = sub_repo
        self._submission_queue = submission_queue
        self._user_service = user_service

    async def __call__(
        self,
        submission_id: UUID,
        task_id: UUID,
        user_id: int,
    ) -> HackathonSubmissionEntity:
        now = datetime.now()

        submission = await self._sub_repo.get(submission_id)
        if not submission or submission.task_id != task_id:
            raise AppException("Submission not found", 404)

        task = await self._task_repo.get(task_id)
        if not task:
            raise AppException("Task not found", 404)

        hackathon = await self._hackathon_repo.get(task.hackathon_id)
        if not hackathon:
            raise AppException("Hackathon not found", 404)

        if hackathon.start_time and now < hackathon.start_time:
            raise AppException("Hackathon has not started accepting submissions", 400)
        if hackathon.end_time and now > hackathon.end_time:
            raise AppException("Hackathon submission window has ended", 400)

        team_id = await self._validate_submitter(submission, hackathon.id, user_id)

        if submission.status in {
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.RUNNING,
            SubmissionStatus.EVALUATING,
            SubmissionStatus.PUBLISHED,
        }:
            return submission

        if submission.status != SubmissionStatus.UPLOADING:
            raise AppException(
                f"Submission cannot be queued from status {submission.status.value}",
                400,
            )

        await self._sub_repo.acquire_quota_lock(
            task_id=task.id, user_id=user_id, team_id=team_id
        )
        latest_submission = await self._sub_repo.get(submission_id)
        if not latest_submission or latest_submission.task_id != task_id:
            raise AppException("Submission not found", 404)
        submission = latest_submission

        if submission.status in {
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.RUNNING,
            SubmissionStatus.EVALUATING,
            SubmissionStatus.PUBLISHED,
        }:
            return submission

        if submission.status != SubmissionStatus.UPLOADING:
            raise AppException(
                f"Submission cannot be queued from status {submission.status.value}",
                400,
            )

        count = await self._sub_repo.count_submissions(
            task_id=task.id, user_id=user_id, team_id=team_id
        )
        if count >= task.max_submissions:
            raise AppException(
                f"Submission limit reached ({task.max_submissions}/{task.max_submissions})",
                400,
            )

        submission.status = SubmissionStatus.EXTRACTING
        submission.error_message = None
        submission.logs = None
        submission.updated_at = now
        submission = await self._sub_repo.update(submission)
        await self._sub_repo.commit()

        try:
            await self._submission_queue.enqueue_evaluation(submission_id=submission.id)
        except Exception as queue_err:
            submission.status = SubmissionStatus.FAILED
            submission.error_message = f"Queue Error: {queue_err}"
            submission.updated_at = datetime.now()
            submission = await self._sub_repo.update(submission)
            await self._sub_repo.commit()
            raise AppException(
                f"Submission saved but could not be queued: {queue_err}",
                500,
            ) from queue_err

        return submission

    async def _validate_submitter(
        self,
        submission: HackathonSubmissionEntity,
        hackathon_id: UUID,
        user_id: int,
    ) -> UUID | None:
        if submission.team_id:
            team = await self._team_repo.get(submission.team_id)
            if not team or user_id not in team.member_ids:
                raise AppException("You cannot submit for this team", 403)
            reg = await self._reg_repo.get_team_registration(hackathon_id, team.id)
            if not reg or reg.status != RegistrationStatus.APPROVED:
                raise AppException("Team registration is not approved", 400)
            return team.id

        if submission.user_id != user_id:
            raise AppException("You cannot submit this submission", 403)

        reg = await self._reg_repo.get_user_registration(hackathon_id, user_id)
        if not reg or reg.status != RegistrationStatus.APPROVED:
            raise AppException("Registration is not approved", 400)
        return None
