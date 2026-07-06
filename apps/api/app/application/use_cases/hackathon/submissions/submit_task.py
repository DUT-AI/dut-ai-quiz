import re
import unicodedata
from datetime import datetime
from uuid import UUID, uuid4

from app.application.services.user_service import UserService
from app.config import settings
from app.domain.entities.hackathon import RegistrationStatus
from app.domain.entities.submission import HackathonSubmissionEntity, SubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces import (
    IHackathonRegistrationRepository,
    IHackathonRepository,
    IHackathonSubmissionRepository,
    IHackathonSubmissionStore,
    IHackathonTaskRepository,
    IHackathonTeamRepository,
    ISubmissionQueue,
)
from fastapi import UploadFile


def slugify(text: str) -> str:
    """Normalize and slugify a string for S3 keys."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = text.lower()
    text = re.sub(r"[^a-z0-9_-]", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


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
        script_s3_key: str,
        script_url: str,
        model_s3_key: str,
        model_url: str,
    ) -> HackathonSubmissionEntity:
        if not model_s3_key or not model_url:
            raise AppException("Tệp model weights là bắt buộc", 400)
        now = datetime.now()

        # 1. Kiểm tra sự tồn tại của Task
        task = await self._task_repo.get(task_id)
        if not task:
            raise AppException("Bài tập không tồn tại", 404)

        # 2. Kiểm tra sự tồn tại của Hackathon
        hackathon = await self._hackathon_repo.get(task.hackathon_id)
        if not hackathon:
            raise AppException("Cuộc thi không tồn tại", 404)

        # 3. Kiểm tra xem Hackathon có đang diễn ra không
        if hackathon.start_time and now < hackathon.start_time:
            raise AppException("Cuộc thi chưa bắt đầu nộp bài", 400)
        if hackathon.end_time and now > hackathon.end_time:
            raise AppException("Cuộc thi đã kết thúc thời gian nộp bài", 400)

        # 4. Xác định Đội thi / Cá nhân và Kiểm tra duyệt đăng ký (APPROVED)
        team = await self._team_repo.get_user_team(hackathon.id, user_id)
        if team:
            # Đăng ký với tư cách đội thi
            reg = await self._reg_repo.get_team_registration(hackathon.id, team.id)
            if not reg or reg.status != RegistrationStatus.APPROVED:
                raise AppException(
                    "Đội thi của bạn chưa được duyệt đăng ký tham gia", 400
                )
            team_id = team.id
        else:
            # Đăng ký cá nhân
            reg = await self._reg_repo.get_user_registration(hackathon.id, user_id)
            if not reg or reg.status != RegistrationStatus.APPROVED:
                raise AppException("Bạn chưa được duyệt đăng ký tham gia cuộc thi", 400)
            team_id = None

        # 5. Lưu bản ghi nộp bài vào Database
        submission_entity = HackathonSubmissionEntity(
            id=submission_id,
            task_id=task.id,
            user_id=user_id,
            team_id=team_id,
            script_url=script_url,
            model_url=model_url,
            status=SubmissionStatus.UPLOADING,
            created_at=now,
        )

        submission_entity = await self._sub_repo.add(submission_entity)

        # 6. Đẩy job evaluate_submission_job vào arq Redis queue
        try:
            await self._submission_queue.enqueue_evaluation(
                submission_id=submission_id,
                script_s3_key=script_s3_key,
                ground_truth_s3_key=task.private_test_url,
                metric_type=task.metric_type.value,
            )
        except Exception as queue_err:
            # LƯU Ý: Nếu đẩy queue lỗi, ta vẫn giữ bản ghi UPLOADING, nhưng trả về thông báo lỗi hàng đợi để admin hỗ trợ
            # Không raise trực tiếp mà gán lỗi cho submission để thí sinh biết
            submission_entity.status = SubmissionStatus.FAILED
            submission_entity.error_message = (
                f"Hàng đợi quá tải (Queue Error): {str(queue_err)}"
            )
            await self._sub_repo.update(submission_entity)
            raise AppException(
                f"Nộp bài thành công nhưng không thể xếp lịch chấm điểm: {str(queue_err)}",
                500,
            ) from queue_err

        return submission_entity
