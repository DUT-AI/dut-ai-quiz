from uuid import UUID

from app.domain.entities.submission import SubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.hackathon_repo import (
    IHackathonSubmissionRepository,
    IHackathonTeamRepository,
)


class GetSubmissionLogsUseCase:
    def __init__(
        self,
        sub_repo: IHackathonSubmissionRepository,
        team_repo: IHackathonTeamRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._team_repo = team_repo

    async def __call__(self, submission_id: UUID, user_id: int, quiz_role: str) -> str:
        # 1. Lấy thông tin lượt nộp
        submission = await self._sub_repo.get(submission_id)
        if not submission:
            raise AppException("Không tìm thấy lượt nộp bài này", 404)

        # 2. Kiểm tra quyền truy cập (Admin/Mentor có toàn quyền; Thí sinh chỉ được xem của đội mình)
        is_admin_or_mentor = quiz_role in ("admin", "mentor")

        if not is_admin_or_mentor:
            if submission.team_id:
                team = await self._team_repo.get(submission.team_id)
                if not team or user_id not in team.member_ids:
                    raise AppException(
                        "Bạn không có quyền truy cập log của lượt nộp này", 403
                    )
            else:
                if submission.user_id != user_id:
                    raise AppException(
                        "Bạn không có quyền truy cập log của lượt nộp này", 403
                    )

            # Th thí sinh chỉ được xem log khi lượt nộp bài bị lỗi (FAILED)
            if submission.status != SubmissionStatus.FAILED:
                raise AppException(
                    "Log lỗi chỉ hiển thị đối với lượt nộp bài bị thất bại (FAILED)",
                    400,
                )

        # 3. Trả về log lỗi (đã được trim tối đa 50 dòng từ worker)
        return submission.logs or ""
