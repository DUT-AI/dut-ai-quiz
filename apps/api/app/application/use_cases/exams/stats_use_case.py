from uuid import UUID

from app.domain.value_objects import AttemptStatus
from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
)
from app.presentation.schemas.stats import (
    ExamStatsOut,
    ExamSummary,
    ParticipantStat,
    QuestionStat,
    ScoreDistributionItem,
)


class GetExamStatsUseCase:
    def __init__(
        self,
        exam_repo: IExamRepository,
        att_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
    ):
        self._exam_repo = exam_repo
        self._att_repo = att_repo
        self._eq_repo = eq_repo

    async def execute(self, exam_id: UUID) -> ExamStatsOut:
        # 1. Fetch Exam
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise ValueError("Exam not found")

        # 2. Fetch all attempts
        attempts = await self._att_repo.list_all_for_exam(exam_id)

        # 3. Fetch all questions for this exam
        questions = await self._eq_repo.load_questions_ordered(exam_id)

        # 4. Summary & Distribution
        completed_attempts = [
            a
            for a in attempts
            if a.status == AttemptStatus.COMPLETED and a.score is not None
        ]
        scores = [a.score for a in completed_attempts]

        unique_users = {a.user_id for a in attempts}
        completed_users = {a.user_id for a in completed_attempts}

        avg_score = round(sum(scores) / len(scores), 2) if scores else 0.0
        max_score = max(scores) if scores else 0.0

        dist = {"0-2": 0, "2-4": 0, "4-6": 0, "6-8": 0, "8-10": 0}

        # Best score per user for distribution
        user_best_scores = {}
        for a in completed_attempts:
            if (
                a.user_id not in user_best_scores
                or a.score > user_best_scores[a.user_id]
            ):
                user_best_scores[a.user_id] = a.score

        for sc in user_best_scores.values():
            if sc < 2:
                dist["0-2"] += 1
            elif sc < 4:
                dist["2-4"] += 1
            elif sc < 6:
                dist["4-6"] += 1
            elif sc < 8:
                dist["6-8"] += 1
            else:
                dist["8-10"] += 1

        score_distribution = [
            ScoreDistributionItem(range=k, count=v) for k, v in dist.items()
        ]

        # 5. Participants Stat
        user_stats = {}
        for a in attempts:
            uid = a.user_id
            if uid not in user_stats:
                user_stats[uid] = {
                    "user_id": uid,
                    "best_score": a.score
                    if a.status == AttemptStatus.COMPLETED
                    else None,
                    "attempts_count": 0,
                    "last_status": a.status,
                    "max_tab_out": a.tab_out_count,
                }

            s = user_stats[uid]
            s["attempts_count"] += 1
            if a.status == AttemptStatus.COMPLETED:
                if s["best_score"] is None or a.score > s["best_score"]:
                    s["best_score"] = a.score
            s["last_status"] = a.status
            s["max_tab_out"] = max(s["max_tab_out"], a.tab_out_count)

        participants = [ParticipantStat(**v) for v in user_stats.values()]

        # 6. Question Stats
        question_stats = []
        if completed_attempts:
            all_answers = await self._att_repo.list_all_answers_for_exam(exam_id)

            ans_map = {}
            for ans in all_answers:
                ans_map[(ans.attempt_id, ans.question_id)] = ans.selected_option_id

            for q in questions:
                correct_count = 0
                correct_opt_id = None
                for opt in q.options:
                    if opt.is_correct:
                        correct_opt_id = str(opt.id)
                        break

                for a in completed_attempts:
                    sel = ans_map.get((a.id, q.id))
                    if sel == correct_opt_id and correct_opt_id is not None:
                        correct_count += 1

                question_stats.append(
                    QuestionStat(
                        question_id=q.id,
                        content=q.content[:100]
                        + ("..." if len(q.content) > 100 else ""),
                        correct_rate=round(correct_count / len(completed_attempts), 2),
                    )
                )
        else:
            for q in questions:
                question_stats.append(
                    QuestionStat(
                        question_id=q.id,
                        content=q.content,
                        correct_rate=0.0,
                    )
                )

        return ExamStatsOut(
            summary=ExamSummary(
                total_assigned=len(exam.participant_ids or []),
                total_started=len(unique_users),
                total_completed=len(completed_users),
                average_score=avg_score,
                max_score=max_score,
            ),
            score_distribution=score_distribution,
            participants=participants,
            question_stats=question_stats,
        )
