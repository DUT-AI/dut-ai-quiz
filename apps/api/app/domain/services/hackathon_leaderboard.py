from app.domain.entities.hackathon import HackathonTaskEntity, MetricType
from app.domain.entities.submission import HackathonSubmissionEntity, SubmissionStatus
from app.domain.value_objects.hackathon_leaderboard import HackathonLeaderboardRow


class HackathonLeaderboardDomainService:
    def calculate_leaderboard(
        self,
        tasks: list[HackathonTaskEntity],
        submissions: list[HackathonSubmissionEntity],
        is_private: bool = False,
        limit: int = 100,
    ) -> list[HackathonLeaderboardRow]:
        published = [s for s in submissions if s.status == SubmissionStatus.PUBLISHED]

        # participant_id -> {task_id -> best_submission}
        best_by_participant: dict[str, dict[str, HackathonSubmissionEntity]] = {}

        # Precompute metrics per task
        task_metrics: dict[str, bool] = {}
        for task in tasks:
            metric = (
                task.metric_type
                if isinstance(task.metric_type, MetricType)
                else MetricType(str(task.metric_type).lower())
            )
            lower_is_better = metric.lower_is_better
            task_metrics[str(task.id)] = lower_is_better

        # Find best submission per participant per task
        for submission in published:
            task_id = str(submission.task_id)
            if task_id not in task_metrics:
                continue

            score = submission.private_score if is_private else submission.public_score
            if score is None:
                continue

            participant_id = (
                f"team:{submission.team_id}"
                if submission.team_id
                else f"user:{submission.user_id}"
            )

            if participant_id not in best_by_participant:
                best_by_participant[participant_id] = {}

            current = best_by_participant[participant_id].get(task_id)
            if current is None:
                best_by_participant[participant_id][task_id] = submission
            else:
                current_score = (
                    current.private_score if is_private else current.public_score
                )
                lower_is_better = task_metrics[task_id]
                if current_score is not None and self._is_better(
                    score, current_score, lower_is_better
                ):
                    best_by_participant[participant_id][task_id] = submission

        # Find min/max best scores per task
        task_min_max: dict[str, dict[str, float]] = {}
        for task in tasks:
            task_id = str(task.id)
            scores = []
            for p_id, p_tasks in best_by_participant.items():
                if task_id in p_tasks:
                    s = (
                        p_tasks[task_id].private_score
                        if is_private
                        else p_tasks[task_id].public_score
                    )
                    if s is not None:
                        scores.append(s)

            if scores:
                task_min_max[task_id] = {"min": min(scores), "max": max(scores)}
            else:
                task_min_max[task_id] = {"min": 0.0, "max": 0.0}

        # Calculate final stats per participant
        participant_stats = []
        for p_id, p_tasks in best_by_participant.items():
            task_scores = {}
            normalized_scores = []
            total_inference_time = 0.0
            latest_time = None

            user_id = None
            team_id = None
            participant_type = "user"

            for task in tasks:
                task_id = str(task.id)
                sub = p_tasks.get(task_id)
                if sub is not None:
                    # set user/team
                    user_id = sub.user_id
                    team_id = sub.team_id
                    participant_type = "team" if sub.team_id else "user"

                    score = sub.private_score if is_private else sub.public_score
                    if score is not None:
                        task_scores[task_id] = score
                        # normalize
                        t_min = task_min_max[task_id]["min"]
                        t_max = task_min_max[task_id]["max"]
                        if t_max > t_min:
                            if task_metrics[task_id]:  # lower is better
                                norm = (t_max - score) / (t_max - t_min)
                            else:
                                norm = (score - t_min) / (t_max - t_min)
                        else:
                            norm = 1.0  # everyone gets 1.0 if min == max and they submitted
                        normalized_scores.append(norm)

                    if sub.inference_time is not None:
                        total_inference_time += sub.inference_time

                    sub_time = sub.updated_at or sub.created_at
                    if latest_time is None or sub_time > latest_time:
                        latest_time = sub_time
                else:
                    # not submitted = 0.0 normalized score
                    normalized_scores.append(0.0)

            # Each task contributes up to one normalized point.
            total_score = sum(normalized_scores)

            participant_stats.append(
                {
                    "participant_id": p_id,
                    "participant_type": participant_type,
                    "user_id": user_id,
                    "team_id": team_id,
                    "task_scores": task_scores,
                    "total_score": total_score,
                    "total_inference_time": total_inference_time,
                    "latest_submission_time": latest_time,
                }
            )

        # Sort: Total Score (Desc), Total Inference Time (Asc), Latest Submission Time (Asc)
        # Note: We use -total_score to sort descending.
        participant_stats.sort(
            key=lambda x: (
                -x["total_score"],
                x["total_inference_time"],
                x["latest_submission_time"].timestamp()
                if x["latest_submission_time"]
                else 0,
            )
        )

        rows: list[HackathonLeaderboardRow] = []
        for index, stat in enumerate(participant_stats[:limit], start=1):
            if stat["user_id"] is None:
                continue  # Should not happen

            rows.append(
                HackathonLeaderboardRow(
                    rank=index,
                    participant_id=stat["participant_id"],
                    participant_type=stat["participant_type"],
                    user_id=stat["user_id"],
                    team_id=stat["team_id"],
                    task_scores=stat["task_scores"],
                    total_score=stat["total_score"],
                    total_inference_time=stat["total_inference_time"],
                    latest_submission_time=stat["latest_submission_time"],
                )
            )
        return rows

    def _is_better(
        self, candidate_score: float, current_score: float, lower_is_better: bool
    ) -> bool:
        if lower_is_better:
            return candidate_score < current_score
        return candidate_score > current_score
