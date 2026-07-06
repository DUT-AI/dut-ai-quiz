import pytest
from datetime import datetime, timedelta
from typing import Any
from unittest.mock import AsyncMock, MagicMock
from uuid import UUID, uuid4

from app.application.use_cases.hackathon.submissions.cancel_submission import (
    CancelSubmissionUseCase,
)
from app.application.use_cases.hackathon.submissions.submit_task import (
    SubmitTaskUseCase,
)
from app.application.use_cases.hackathon.submissions.presign_submit import (
    PresignSubmitUseCase,
)
from app.domain.entities.hackathon import (
    HackathonEntity,
    HackathonRegistrationEntity,
    HackathonTaskEntity,
    HackathonTeamEntity,
    MetricType,
    ParticipationMode,
    RegistrationStatus,
)
from app.domain.entities.submission import HackathonSubmissionEntity, SubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
    ISubmissionQueue,
    IS3Client,
)


class MockHackathonRepo(IHackathonRepository):
    def __init__(self, hackathon):
        self.hackathon = hackathon

    async def get(self, id):
        return self.hackathon


class MockTaskRepo(IHackathonTaskRepository):
    def __init__(self, task):
        self.task = task

    async def get(self, id):
        return self.task


class MockTeamRepo(IHackathonTeamRepository):
    def __init__(self, team=None):
        self.team = team

    async def get(self, team_id):
        return self.team

    async def get_user_team(self, hid, uid):
        return self.team


class MockRegRepo(IHackathonRegistrationRepository):
    def __init__(self, reg):
        self.reg = reg

    async def get_user_registration(self, hid, uid):
        return self.reg

    async def get_team_registration(self, hid, tid):
        return self.reg


class MockSubRepo(IHackathonSubmissionRepository):
    def __init__(self, last_sub=None, count=0):
        self.last_sub = last_sub
        self.count = count
        self.added = None
        self.updated = None

    async def get(self, id):
        return self.added or self.last_sub

    async def get_last_submission(self, task_id, user_id, team_id):
        return self.last_sub

    async def count_submissions(self, task_id, user_id, team_id):
        return self.count

    async def add(self, entity):
        self.added = entity
        return entity

    async def update(self, entity):
        self.updated = entity
        return entity


class MockUserService:
    async def get_user_info(self, uid):
        user = MagicMock()
        user.name = "Test User"
        return user


class MockS3Client(IS3Client):
    def upload_fileobj(self, file_obj: Any, bucket: str, key: str) -> None:
        pass

    def get_object_url(self, bucket: str, key: str) -> str:
        return f"https://minio/{bucket}/{key}"

    def generate_presigned_upload_url(
        self, bucket: str, key: str, content_type: str, expires_in: int = 3600
    ) -> str:
        return f"https://minio/{bucket}/{key}?presigned=true"


class MockSubmissionQueue(ISubmissionQueue):
    def __init__(self) -> None:
        self.enqueued = []

    async def enqueue_evaluation(
        self,
        submission_id: UUID,
        script_s3_key: str,
        ground_truth_s3_key: str,
        metric_type: str,
    ) -> None:
        self.enqueued.append({
            "submission_id": submission_id,
            "script_s3_key": script_s3_key,
            "ground_truth_s3_key": ground_truth_s3_key,
            "metric_type": metric_type,
        })


@pytest.mark.asyncio
async def test_presign_submit_success():
    hid = uuid4()
    hackathon = HackathonEntity(
        id=hid,
        name="Hackathon 1",
        description="",
        rules="",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now() + timedelta(days=1),
        participation_mode=ParticipationMode.INDIVIDUAL,
        created_by=1,
        created_at=datetime.now(),
    )

    task = HackathonTaskEntity(
        id=uuid4(),
        hackathon_id=hid,
        name="Task 1",
        problem_description_md="",
        private_test_url="private.csv",
        public_test_url="public.csv",
        metric_type=MetricType.ACCURACY,
        max_submissions=5,
        created_at=datetime.now(),
    )

    reg = HackathonRegistrationEntity(
        id=uuid4(),
        hackathon_id=hid,
        user_id=1,
        team_id=None,
        status=RegistrationStatus.APPROVED,
        registered_at=datetime.now(),
    )

    hackathon_repo = MockHackathonRepo(hackathon)
    task_repo = MockTaskRepo(task)
    team_repo = MockTeamRepo(None)
    reg_repo = MockRegRepo(reg)
    sub_repo = MockSubRepo(last_sub=None, count=0)
    user_service = MockUserService()
    s3_client = MockS3Client()

    use_case = PresignSubmitUseCase(
        hackathon_repo,
        task_repo,
        team_repo,
        reg_repo,
        sub_repo,
        s3_client,
        user_service,
    )

    res = await use_case(
        task_id=task.id,
        user_id=1,
        script_filename="predict.py",
        model_filename="weights.pth"
    )

    assert res is not None
    assert res.submission_id is not None
    assert "presigned=true" in res.script.upload_url
    assert res.model is not None
    assert "presigned=true" in res.model.upload_url


@pytest.mark.asyncio
async def test_submit_task_success():
    hid = uuid4()
    hackathon = HackathonEntity(
        id=hid,
        name="Hackathon 1",
        description="",
        rules="",
        start_time=datetime.now() - timedelta(days=1),
        end_time=datetime.now() + timedelta(days=1),
        participation_mode=ParticipationMode.INDIVIDUAL,
        created_by=1,
        created_at=datetime.now(),
    )

    task = HackathonTaskEntity(
        id=uuid4(),
        hackathon_id=hid,
        name="Task 1",
        problem_description_md="",
        private_test_url="private.csv",
        public_test_url="public.csv",
        metric_type=MetricType.ACCURACY,
        max_submissions=5,
        created_at=datetime.now(),
    )

    reg = HackathonRegistrationEntity(
        id=uuid4(),
        hackathon_id=hid,
        user_id=1,
        team_id=None,
        status=RegistrationStatus.APPROVED,
        registered_at=datetime.now(),
    )

    hackathon_repo = MockHackathonRepo(hackathon)
    task_repo = MockTaskRepo(task)
    team_repo = MockTeamRepo(None)
    reg_repo = MockRegRepo(reg)
    sub_repo = MockSubRepo(last_sub=None, count=0)
    user_service = MockUserService()
    submission_queue = MockSubmissionQueue()

    use_case = SubmitTaskUseCase(
        hackathon_repo,
        task_repo,
        team_repo,
        reg_repo,
        sub_repo,
        submission_queue,
        user_service,
    )

    sub_id = uuid4()
    res = await use_case(
        submission_id=sub_id,
        task_id=task.id,
        user_id=1,
        script_s3_key="hackathons/hackathon-1/test-user/predict.py",
        script_url="https://minio/lms-dev/hackathons/hackathon-1/test-user/predict.py",
        model_s3_key="hackathons/hackathon-1/test-user/model.bin",
        model_url="https://minio/lms-dev/hackathons/hackathon-1/test-user/model.bin"
    )

    assert res is not None
    assert res.id == sub_id
    assert res.status == SubmissionStatus.UPLOADING
    assert sub_repo.added is not None
    assert len(submission_queue.enqueued) == 1
    assert submission_queue.enqueued[0]["submission_id"] == sub_id


@pytest.mark.asyncio
async def test_cancel_submission_success():
    sub_id = uuid4()
    submission = HackathonSubmissionEntity(
        id=sub_id,
        task_id=uuid4(),
        user_id=1,
        script_url="http://s3/predict.py",
        status=SubmissionStatus.RUNNING,
        created_at=datetime.now(),
    )

    sub_repo = MockSubRepo(last_sub=submission)
    team_repo = MockTeamRepo(None)
    mock_redis = AsyncMock()

    use_case = CancelSubmissionUseCase(sub_repo, team_repo, mock_redis)

    res = await use_case(sub_id, 1)

    assert res.status == SubmissionStatus.CANCELLED
    assert mock_redis.set.called
    assert sub_repo.updated.status == SubmissionStatus.CANCELLED
