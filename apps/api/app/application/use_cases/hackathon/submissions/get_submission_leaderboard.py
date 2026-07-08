from dataclasses import dataclass
from datetime import datetime
from uuid import UUID

from app.domain.entities.hackathon import MetricType
from app.domain.entities.submission import SubmissionStatus
from app.domain.exceptions.exceptions import AppException
from app.domain.interfaces.hackathon_repo import (
    IHackathonSubmissionRepository,
    IHackathonTaskRepository,
)


@dataclass(slots=True)
class HackathonLeaderboardRow:
    rank: int
    participant_id: str
    participant_type: str
    user_id: int
    team_id: UUID | None
    submission_id: UUID
    score: float
    updated_at: datetime | None

    def to_dict(self) -> dict:
        return {
            "rank": self.rank,
            "participant_id": self.participant_id,
            "participant_type": self.participant_type,
            "user_id": self.user_id,
            "team_id": str(self.team_id) if self.team_id else None,
            "submission_id": str(self.submission_id),
            "score": self.score,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }


class GetHackathonSubmissionLeaderboardUseCase:
    def __init__(
        self,
        sub_repo: IHackathonSubmissionRepository,
        task_repo: IHackathonTaskRepository,
    ) -> None:
        self._sub_repo = sub_repo
        self._task_repo = task_repo

    async def __call__(
        self, task_id: UUID, limit: int = 100
    ) -> list[HackathonLeaderboardRow]:
        task = await self._task_repo.get(task_id)
        if not task:
            raise AppException("Bài tập không tồn tại", 404)

        submissions = await self._sub_repo.list_for_task(task_id)
        published = [
            submission
            for submission in submissions
            if submission.status == SubmissionStatus.PUBLISHED
            and submission.score is not None
        ]

        best_by_participant = {}
        metric_value = getattr(task.metric_type, "value", str(task.metric_type))
        lower_is_better = metric_value.lower() == MetricType.RMSE.value

        for submission in published:
            participant_id = (
                f"team:{submission.team_id}"
                if submission.team_id
                else f"user:{submission.user_id}"
            )
            current = best_by_participant.get(participant_id)
            if current is None or self._is_better(
                candidate_score=submission.score,
                current_score=current.score,
                lower_is_better=lower_is_better,
            ):
                best_by_participant[participant_id] = submission

        ranked = sorted(
            best_by_participant.values(),
            key=lambda submission: (
                submission.score if lower_is_better else -submission.score,
                submission.updated_at or submission.created_at,
            ),
        )

        rows: list[HackathonLeaderboardRow] = []
        for index, submission in enumerate(ranked[:limit], start=1):
            is_team = submission.team_id is not None
            rows.append(
                HackathonLeaderboardRow(
                    rank=index,
                    participant_id=(
                        str(submission.team_id)
                        if submission.team_id
                        else str(submission.user_id)
                    ),
                    participant_type="team" if is_team else "user",
                    user_id=submission.user_id,
                    team_id=submission.team_id,
                    submission_id=submission.id,
                    score=submission.score,
                    updated_at=submission.updated_at,
                )
            )
        return rows

    def _is_better(
        self, candidate_score: float, current_score: float, lower_is_better: bool
    ) -> bool:
        if lower_is_better:
            return candidate_score < current_score
        return candidate_score > current_score
