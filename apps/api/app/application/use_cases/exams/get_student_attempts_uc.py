from uuid import UUID

from app.domain.interfaces import (
    IAttemptRepository,
    IExamQuestionRepository,
    IExamRepository,
    IFocusEventRepository,
    IQuestionRepository,
)
from app.domain.value_objects import AttemptStatus
from app.presentation.schemas.exam_attempts import (
    QuestionOptionDetail,
    StudentAttemptDetailOut,
    StudentAttemptFocusEventOut,
    StudentAttemptQuestionDetail,
    StudentExamAttemptsResponse,
)
from fastapi import HTTPException


class GetStudentAttemptsUseCase:
    def __init__(
        self,
        exam_repo: IExamRepository,
        attempt_repo: IAttemptRepository,
        eq_repo: IExamQuestionRepository,
        question_repo: IQuestionRepository,
        fe_repo: IFocusEventRepository,
    ):
        self._exam_repo = exam_repo
        self._attempt_repo = attempt_repo
        self._eq_repo = eq_repo
        self._question_repo = question_repo
        self._fe_repo = fe_repo

    async def execute(
        self, exam_id: UUID, student_id: int
    ) -> StudentExamAttemptsResponse:
        exam = await self._exam_repo.get(exam_id)
        if not exam:
            raise HTTPException(status_code=404, detail="Exam not found")

        attempts = await self._attempt_repo.list_for_user_and_exam(exam_id, student_id)
        all_exam_questions = await self._eq_repo.load_questions_ordered(exam_id)
        questions_by_id = {q.id: q for q in all_exam_questions}

        attempt_details: list[StudentAttemptDetailOut] = []
        best_score: float | None = None
        max_tab_out = 0

        for att in attempts:
            if att.status == AttemptStatus.COMPLETED and att.score is not None:
                if best_score is None or att.score > best_score:
                    best_score = att.score
            if att.tab_out_count > max_tab_out:
                max_tab_out = att.tab_out_count

            # 1. Reconstruct question presentation (shuffle_snapshot if available)
            if att.shuffle_snapshot and att.shuffle_snapshot.question_order:
                ordered_q = []
                for q_id_str in att.shuffle_snapshot.question_order:
                    qid = UUID(q_id_str)
                    if qid in questions_by_id:
                        ordered_q.append(questions_by_id[qid])
                    else:
                        q = await self._question_repo.get(qid)
                        if q:
                            ordered_q.append(q)

                q_list = att.shuffle_snapshot.reconstruct_review_questions(
                    {q.id: q for q in ordered_q}
                )
            else:
                q_list = all_exam_questions

            # 2. Load saved answers
            answers = await self._attempt_repo.list_answers(att.id)
            ans_map = {a.question_id: a.selected_option_id for a in answers}

            # 3. Format question details
            question_details: list[StudentAttemptQuestionDetail] = []
            for q in q_list:
                correct_opt_id: str | None = None
                options: list[QuestionOptionDetail] = []
                for opt in q.options:
                    opt_text = getattr(opt, "text", getattr(opt, "content", ""))
                    if opt.is_correct:
                        correct_opt_id = opt.id
                    options.append(
                        QuestionOptionDetail(
                            id=opt.id,
                            content=opt_text,
                            is_correct=bool(opt.is_correct),
                        )
                    )

                selected = ans_map.get(q.id)
                is_correct: bool | None = None
                if selected is not None:
                    is_correct = selected == correct_opt_id if correct_opt_id else False

                question_details.append(
                    StudentAttemptQuestionDetail(
                        id=q.id,
                        content=q.content,
                        options=options,
                        selected_option_id=selected if selected else None,
                        correct_option_id=correct_opt_id,
                        is_correct=is_correct,
                    )
                )

            # 4. Load focus events
            fe_entities = await self._fe_repo.list_for_attempt(att.id)
            focus_events = [
                StudentAttemptFocusEventOut(
                    id=fe.id,
                    event=fe.event,
                    received_at=fe.received_at,
                )
                for fe in fe_entities
            ]

            attempt_details.append(
                StudentAttemptDetailOut(
                    id=att.id,
                    exam_id=att.exam_id,
                    user_id=att.user_id,
                    status=att.status.value
                    if hasattr(att.status, "value")
                    else str(att.status),
                    score=att.score,
                    tab_out_count=att.tab_out_count,
                    started_at=att.started_at,
                    completed_at=att.completed_at,
                    expires_at=att.expires_at,
                    questions=question_details,
                    focus_events=focus_events,
                )
            )

        return StudentExamAttemptsResponse(
            student_id=student_id,
            exam_id=exam_id,
            attempts=attempt_details,
            total_attempts=len(attempts),
            best_score=best_score,
            max_tab_out=max_tab_out,
        )
