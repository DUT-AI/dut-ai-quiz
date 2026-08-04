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
    IHackathonTaskRepository,
    IHackathonTeamRepository,
    IS3Client,
)
from app.presentation.schemas.submissions import PresignSubmitOut, PresignURLInfo


def slugify(text: str) -> str:
    """Normalize and slugify a string for S3 keys."""
    text = unicodedata.normalize("NFKD", text).encode("ascii", "ignore").decode("utf-8")
    text = text.lower()
    text = re.sub(r"[^a-z0-9_-]", "-", text)
    text = re.sub(r"-+", "-", text)
    return text.strip("-")


class PresignSubmitUseCase:
    def __init__(
        self,
        hackathon_repo: IHackathonRepository,
        task_repo: IHackathonTaskRepository,
        team_repo: IHackathonTeamRepository,
        reg_repo: IHackathonRegistrationRepository,
        sub_repo: IHackathonSubmissionRepository,
        s3_client: IS3Client,
        user_service: UserService,
    ) -> None:
        self._hackathon_repo = hackathon_repo
        self._task_repo = task_repo
        self._team_repo = team_repo
        self._reg_repo = reg_repo
        self._sub_repo = sub_repo
        self._s3_client = s3_client
        self._user_service = user_service

    async def __call__(
        self,
        task_id: UUID,
        user_id: int,
        script_filename: str,
        model_filename: str | None = None,
    ) -> PresignSubmitOut:
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
            reg = await self._reg_repo.get_team_registration(hackathon.id, team.id)
            if not reg or reg.status != RegistrationStatus.APPROVED:
                raise AppException(
                    "Đội thi của bạn chưa được duyệt đăng ký tham gia", 400
                )
            sender_name = team.name
            team_id = team.id
        else:
            reg = await self._reg_repo.get_user_registration(hackathon.id, user_id)
            if not reg or reg.status != RegistrationStatus.APPROVED:
                raise AppException("Bạn chưa được duyệt đăng ký tham gia cuộc thi", 400)
            user_info = await self._user_service.get_user_info(user_id)
            sender_name = user_info.name
            team_id = None

        # 5. Kiểm tra Quota số lượt nộp bài hợp lệ
        count = await self._sub_repo.count_submissions(
            task_id=task.id, user_id=user_id, team_id=team_id
        )
        if count >= task.max_submissions:
            raise AppException(
                f"Bạn đã đạt giới hạn nộp bài tối đa cho bài tập này ({task.max_submissions}/{task.max_submissions} lần)",
                400,
            )

        # 6. Kiểm tra phần mở rộng file script
        if not script_filename.lower().endswith(".py"):
            raise AppException("File script phải có định dạng python (.py)", 400)

        # 7. Sinh submission_id và S3 keys
        submission_id = uuid4()
        hackathon_slug = slugify(hackathon.name)
        sender_slug = slugify(sender_name)

        script_s3_key = (
            f"hackathons/{hackathon_slug}/{sender_slug}/{submission_id}/predict.py"
        )

        # 8. Tạo Presigned PUT URL cho Script
        script_upload_url = self._s3_client.generate_presigned_upload_url(
            bucket=settings.s3_bucket_name,
            key=script_s3_key,
            content_type="application/octet-stream",
            expires_in=settings.presigned_url_expire_seconds,
        )
        script_download_url = self._s3_client.get_object_url(
            settings.s3_bucket_name, script_s3_key
        )

        script_info = PresignURLInfo(
            upload_url=script_upload_url,
            s3_key=script_s3_key,
            download_url=script_download_url,
        )

        # 9. Create a presigned upload URL for optional model weights.
        model_download_url = None
        model_info = None
        if model_filename:
            model_ext = (
                model_filename.split(".")[-1] if "." in model_filename else "bin"
            )
            model_s3_key = f"hackathons/{hackathon_slug}/{sender_slug}/{submission_id}/model.{model_ext}"
            model_upload_url = self._s3_client.generate_presigned_upload_url(
                bucket=settings.s3_bucket_name,
                key=model_s3_key,
                content_type="application/octet-stream",
                expires_in=settings.presigned_url_expire_seconds,
            )
            model_download_url = self._s3_client.get_object_url(
                settings.s3_bucket_name, model_s3_key
            )
            model_info = PresignURLInfo(
                upload_url=model_upload_url,
                s3_key=model_s3_key,
                download_url=model_download_url,
            )

        submission_entity = HackathonSubmissionEntity(
            id=submission_id,
            task_id=task.id,
            user_id=user_id,
            team_id=team_id,
            script_url=script_download_url,
            model_url=model_download_url,
            status=SubmissionStatus.UPLOADING,
            created_at=now,
        )
        await self._sub_repo.add(submission_entity)
        await self._sub_repo.commit()

        return PresignSubmitOut(
            submission_id=submission_id,
            script=script_info,
            model=model_info,
        )
