from datetime import datetime
from uuid import UUID
from redis.asyncio import Redis

from app.domain.entities.submission import SubmissionStatus, HackathonSubmissionEntity
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.hackathon_repo import (
    IHackathonSubmissionRepository,
    IHackathonTeamRepository,
)


class CancelSubmissionUseCase:
    def __init__(
        self,
        sub_repo: IHackathonSubmissionRepository,
        team_repo: IHackathonTeamRepository,
        redis: Redis,
    ) -> None:
        self._sub_repo = sub_repo
        self._team_repo = team_repo
        self._redis = redis

    async def __call__(
        self, submission_id: UUID, user_id: int
    ) -> HackathonSubmissionEntity:
        now = datetime.now()

        # 1. Lấy thông tin lượt nộp bài
        submission = await self._sub_repo.get(submission_id)
        if not submission:
            raise AppException("Không tìm thấy lượt nộp bài này", 404)

        # 2. Kiểm tra quyền sở hữu lượt nộp bài (Người nộp hoặc đồng đội)
        if submission.team_id:
            team = await self._team_repo.get(submission.team_id)
            if not team or user_id not in team.member_ids:
                raise AppException("Bạn không có quyền hủy lượt nộp của đội này", 403)
        else:
            if submission.user_id != user_id:
                raise AppException("Bạn không có quyền hủy lượt nộp bài này", 403)

        # 3. Kiểm tra trạng thái lượt nộp bài (Chỉ cho phép hủy khi đang xử lý)
        cancellable_statuses = {
            SubmissionStatus.UPLOADING,
            SubmissionStatus.EXTRACTING,
            SubmissionStatus.RUNNING,
        }
        if submission.status not in cancellable_statuses:
            raise AppException(
                f"Không thể hủy lượt nộp bài này vì trạng thái hiện tại là {submission.status.value}",
                400,
            )

        # 4. Ghi nhận cờ hủy vào Redis để thông báo cho Sandbox Worker dừng tiến trình Docker
        try:
            cancel_key = f"cancel:{submission_id}"
            await self._redis.set(cancel_key, "1", ex=3600)  # Hết hạn sau 1 tiếng
        except Exception as redis_err:
            raise AppException(
                f"Lỗi kết nối hệ thống hàng đợi khi gửi lệnh hủy: {str(redis_err)}", 500
            )

        # 5. Cập nhật trạng thái trong DB thành CANCELLED (Không trừ quota nộp bài)
        submission.status = SubmissionStatus.CANCELLED
        submission.updated_at = now

        try:
            updated_submission = await self._sub_repo.update(submission)
            return updated_submission
        except Exception as db_err:
            raise AppException(
                f"Lỗi cập nhật trạng thái hủy lượt nộp bài: {str(db_err)}", 500
            ) from db_err
