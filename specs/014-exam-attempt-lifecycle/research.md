# Phase 0 Research: Exam Attempt Lifecycle, Dual Scoring & Anti-Cheat Architecture

**Feature**: `014-exam-attempt-lifecycle`  
**Date**: 2026-11-07  
**Status**: Completed  

## 1. Problem Statement & Root Cause Analysis

A thorough audit of the exam attempt system in both `apps/api` (FastAPI / Clean Architecture) and `apps/web` (Next.js 15) revealed several severe business logic discrepancies, security vulnerabilities, and code quality issues:

1. **Scoring Inversion Bug**:
   - Backend scores attempts on a 10-point scale: `score = round(min(correct * (10.0 / n), 10.0), 2)`.
   - Frontend (`review/page.tsx`) interpreted `attempt.score` as the raw count of correct answers, dividing it by `questions.length` (`(attempt.score / questions.length) * 100`) and displaying `{attempt.score} / {questions.length} ĐIỂM`.
   - *Example*: A student with 16 correct answers on a 20-question exam receives a score of 8.0 on the backend. The frontend displays `8 / 20 ĐIỂM` and calculates an erroneous 40% (instead of 80%).
2. **Missing `max_attempts` Enforcement**:
   - `ExamEntity.max_attempts` and database columns exist, but `StartAttemptUseCase.execute()` never calls `AttemptRepository.count_for_user_exam()`.
   - Students can start unlimited attempts even when `max_attempts = 1`.
3. **Orphaned Sessions & Lack of Resume**:
   - If a student refreshes or returns to `/exams/[id]` with an active attempt in progress, clicking "Bắt đầu thi" generates an entirely new attempt, abandoning the previous attempt in `IN_PROGRESS` forever.
4. **Unenforced Expiration in Answer Patching & Late Submissions**:
   - `PatchAttemptAnswersUseCase` only checks `status == IN_PROGRESS`, never checking `now_ict() > expires_at`.
   - `SubmitAttemptUseCase` does not enforce expiration or provide a controlled network grace window.
5. **Anti-Cheat False Positives & macOS Flaws**:
   - `mouse_leave` triggers an instant violation. Rê chuột ra khỏi màn hình (màn hình phụ, thanh Taskbar) 3 lần sẽ khiến bài thi tự động bị nộp.
   - Race condition between the 500ms heartbeat interval and asynchronous `requestFullscreen()` during violation modal dismissal causes duplicate penalties.
   - Keyboard blocking ignores `e.metaKey`, leaving macOS users able to open devtools (`Cmd+Option+I`) and view source.
6. **Backend N+1 Queries & Review Shuffle Desynchronization**:
   - `GetAttemptUseCase` loops through question IDs executing `_question_repo.get(i)` one-by-one.
   - `ReviewAttemptUseCase` returns questions in original exam order instead of reconstructing the student's `shuffle_snapshot`.
7. **Monolithic God-Component**:
   - `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx` exceeds 610 lines, combining anti-cheat, timers, state syncing, modals, and rendering.

---

## 2. Architectural Decisions & Technical Approaches

### Decision 1: Dual Scoring Contract (Thang 10 + Số câu đúng)
- **Decision**:
  - `AttemptEntity` and database model `Attempt` will persist both `score` (Float, scale 10), `correct_count` (Integer, e.g. 16), and `total_questions` (Integer, e.g. 20).
  - Schema `AttemptOut` and `AttemptReviewResponse` will expose `score`, `correct_count`, and `total_questions`.
  - Frontend radial progress indicator will compute percentage as `(score / 10.0) * 100`, displaying `{score.toFixed(1)} / 10 ĐIỂM`, alongside a pill badge displaying `{correct_count} / {total_questions} CÂU ĐÚNG`.
- **Rationale**: Completely resolves ambiguity. Stakeholders and students get both the official academic score (Vietnamese 10-point grading scale) and the exact number of correct questions.
- **Backward Compatibility**: Existing database records with `NULL` for `correct_count` will fall back to calculating from `AttemptAnswer` vs `Question` upon review, or be backfilled via Alembic migration.

### Decision 2: Active Attempt Lifecycle & Resume vs Restart Logic
- **Decision**:
  - Provide a dedicated endpoint: `GET /api/v1/exams/{exam_id}/my-active-attempt` returning the student's current active attempt if `status == IN_PROGRESS` and `now_ict() < expires_at + 60s`.
  - In `StartAttemptUseCase.execute(exam_id, user_id, action="start")`:
    - Check completed attempts: `completed_count = await self._att_repo.count_completed_for_user_exam(user_id, exam_id)`.
    - If `completed_count >= exam.max_attempts`, raise `MaxAttemptsReachedException` (HTTP 403).
    - Check existing `IN_PROGRESS` attempt:
      - If active attempt exists and `action == "start"`: return existing active attempt payload with a flag `is_resumed=True` so user can seamlessly resume.
      - If active attempt exists and `action == "restart"`:
        - Verify if total attempts allow restarting: mark existing active attempt as `AttemptStatus.ABANDONED` and proceed to generate a new shuffled attempt.
- **Rationale**: Protects students from losing progress on accidental refresh/navigation while respecting the educator's `max_attempts` ceiling.

### Decision 3: Expiration Strategy with 60-Second Grace Period
- **Decision**:
  - Official duration: `expires_at = started_at + timedelta(minutes=exam.duration_minutes)`.
  - **Answer Patching cutoff**: `now_ict() <= expires_at + timedelta(seconds=10)`. Answers sent > 10s after official expiry are rejected with `HTTP 400 ("Attempt expired")`.
  - **Submission cutoff (Grace Period)**:
    - If `now_ict() <= expires_at + timedelta(seconds=60)`: Accept submission, score, set `status = AttemptStatus.COMPLETED`.
    - If `now_ict() > expires_at + timedelta(seconds=60)`: Automatically finalize attempt as `AttemptStatus.TIMED_OUT`, calculate score from answers already saved before the cutoff.
  - **Client Clock Skew Normalization**: Include `server_time: datetime` in `GET /attempts/{id}` response so the frontend calculates `timeLeft = expires_at - server_time` with client clock skew compensation.
- **Rationale**: Generously handles high-latency mobile/Wi-Fi connections without allowing students to gain extra exam time.

### Decision 4: Resilient Anti-Cheat with 2.0s Mouse-Leave Grace Window & Mac Support
- **Decision**:
  - **Mouse Leave Timeout**: In `useAntiCheat`, when `mouseleave` fires on `document`, start a 2000ms timer (`mouseLeaveTimerRef`). If `mouseenter` occurs before the timer completes, clear the timer with no violation. If the timer expires before cursor returns, record a single `mouse_leave` violation.
  - **Fullscreen Re-entry Stabilization**:
    - When user clicks "Đã hiểu, quay lại làm bài" in violation modal, call `enterFullScreen()`.
    - Set `cooldownRef.current = Date.now() + 3000`. Heartbeat and blur listeners will ignore events during this 3-second stabilization period to eliminate rapid-fire double strikes.
  - **macOS Shortcut Protection**:
    - Check both `e.ctrlKey || e.metaKey` for DevTools (`I`, `J`, `C`), Source (`U`), Save (`S`), Print (`P`).
    - Also intercept `e.key === "F12"`.

### Decision 5: Eliminating N+1 Query in `GetAttemptUseCase`
- **Decision**:
  - Extend `IQuestionRepository` with `get_by_ids(question_ids: list[UUID]) -> list[QuestionEntity]`.
  - Implement bulk select in `QuestionRepository`: `select(Question).where(Question.id.in_(question_ids))`.
  - In `GetAttemptUseCase`: execute `questions = await self._question_repo.get_by_ids(ids)`, then index into `{q.id: q}` and call `att.shuffle_snapshot.reconstruct_presentation(...)`.
- **Performance Impact**: Reduces database queries from $N + 2$ to 3 constant queries ($O(1)$ database roundtrips).

### Decision 6: Student Review Shuffled Reconstruction
- **Decision**:
  - In `ReviewAttemptUseCase.execute()`:
    - Instead of calling `_eq_repo.load_questions_ordered(att.exam_id)`, load questions via `_question_repo.get_by_ids(ids)` using the student's `shuffle_snapshot.question_order`.
    - Reconstruct the exact option order that the student experienced during the exam via `att.shuffle_snapshot.reconstruct_presentation(...)`.
    - Include `is_correct` in the option payload for review mode (when review lock permits).
- **Rationale**: Ensures what the student sees during review matches their exact exam session.

### Decision 7: Frontend God-Component Decomposition
- **Decision**:
  - Refactor `apps/web/app/(root)/exams/[id]/attempt/[attemptId]/page.tsx` into modular units under `apps/web/features/attempts/`:
    - `hooks/useExamSession.ts`: Manages attempt fetching, answer state, debounced auto-save, and submission.
    - `hooks/useExamTimer.ts`: Manages countdown with server clock skew compensation and auto-submit on timeout.
    - `components/ExamHeader.tsx`: Title, status, progress bar, timer display.
    - `components/QuestionCard.tsx`: Markdown rendering, option choices, keyboard selection.
    - `components/QuestionNavigator.tsx`: Grid palette of questions with answered/unanswered states.
    - `components/AntiCheatModal.tsx`: Warning display and re-enter fullscreen action.
    - `components/SubmitConfirmationModal.tsx`: Summary of answered vs unanswered questions before final submission.
- **Rationale**: High cohesion, low coupling, under 150 lines per component, fully testable.
