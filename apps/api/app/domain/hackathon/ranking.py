from __future__ import annotations

from collections import defaultdict
from datetime import datetime

from app.domain.hackathon.models import (
    CompetitionEntity,
    LeaderboardEntryEntity,
    SubmissionEntity,
    TaskEntity,
    average_score,
)


def _submission_sort_key(submission: SubmissionEntity) -> tuple[float, int, datetime]:
    inference_time = submission.inference_time_ms if submission.inference_time_ms is not None else 10**12
    submitted_at = submission.finished_at or submission.submitted_at
    return (-float(submission.score or 0.0), inference_time, submitted_at)


def build_leaderboard(
    competition: CompetitionEntity,
    tasks: list[TaskEntity],
    submissions: list[SubmissionEntity],
) -> list[LeaderboardEntryEntity]:
    task_ids = [task.id for task in tasks]
    grouped: dict[tuple[int, str], list[SubmissionEntity]] = defaultdict(list)

    for submission in submissions:
        if submission.competition_id == competition.id:
            grouped[(submission.participant_id, submission.participant_name)].append(submission)

    leaderboard: list[LeaderboardEntryEntity] = []

    for (participant_id, participant_name), participant_submissions in grouped.items():
        successful_submissions = [submission for submission in participant_submissions if submission.is_successful()]
        task_scores: dict = {}
        representative: SubmissionEntity | None = None

        for task_id in task_ids:
            task_submissions = [submission for submission in successful_submissions if submission.task_id == task_id]
            if task_submissions:
                best_task_submission = sorted(task_submissions, key=_submission_sort_key)[0]
                task_scores[task_id] = float(best_task_submission.score or 0.0)
                if representative is None or _submission_sort_key(best_task_submission) < _submission_sort_key(representative):
                    representative = best_task_submission
            else:
                task_scores[task_id] = 0.0

        if representative is None and successful_submissions:
            representative = sorted(successful_submissions, key=_submission_sort_key)[0]

        total_score = average_score(list(task_scores.values()))
        inference_time_ms = representative.inference_time_ms if representative else None
        submitted_at = (representative.finished_at or representative.submitted_at) if representative else None

        leaderboard.append(
            LeaderboardEntryEntity(
                rank=0,
                participant_id=participant_id,
                participant_name=participant_name,
                task_scores=task_scores,
                total_score=total_score,
                inference_time_ms=inference_time_ms,
                submitted_at=submitted_at,
                representative_submission_id=representative.id if representative else None,
            )
        )

    leaderboard.sort(
        key=lambda row: (
            -row.total_score,
            row.inference_time_ms if row.inference_time_ms is not None else 10**12,
            row.submitted_at or datetime.max,
            row.participant_name.lower(),
        )
    )

    for index, row in enumerate(leaderboard, start=1):
        row.rank = index

    return leaderboard
