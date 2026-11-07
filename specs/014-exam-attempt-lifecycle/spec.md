# Feature Specification: Exam Attempt Lifecycle, Scoring & Anti-Cheat Overhaul

**Feature Branch**: `014-exam-attempt-lifecycle`

**Created**: 2026-11-07

**Status**: Draft

**Input**: User feedback & decisions:
1. Thang điểm và số câu đúng: API trả về cả hai: `score` (thang 10) và `correct_count` / `total_questions` (số câu đúng thực tế) để giao diện hiển thị rõ ràng cả điểm lẫn số câu đạt được.
2. Hành vi khi mở lại đề thi đang làm dở (`IN_PROGRESS`): Học sinh có thể bấm Resume để làm tiếp hoặc làm lại từ đầu để làm bài mới (có kiểm tra `max_attempts`).
3. Xử lý hết giờ (Expiration Strategy): Cho phép khoảng thời gian ân hạn (grace period: 60 giây) cho các gói tin mạng trễ khi bấm Submit lúc 00:00; chặn patch đáp án sau khi hết giờ.
4. Chính sách Anti-cheat: Vẫn giữ sự kiện `mouse_leave` nhưng bổ sung timeout 2.0s (chuột rời màn hình quá 2s mới tính là vi phạm; quay lại trong 2s thì bỏ qua).
5. Tái tạo đúng `shuffle_snapshot` khi xem lại bài thi (Review) và sửa N+1 queries ở backend.
6. Tách god-component tại giao diện làm bài thi thành các component và hook độc lập, dễ kiểm thử.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Accurate Dual Scoring & Transparent Attempt Review (Priority: P1)

As a student completing an exam or reviewing a past attempt, I want to see both my official score on a 10-point scale (e.g., 8.5 / 10) and my raw count of correct answers (e.g., 17 / 20 câu đúng) with an accurate percentage (85%), and I want the review screen to display the questions and option order exactly as they were shuffled during my attempt.

**Why this priority**: Resolves the critical scoring mismatch where the frontend previously divided the 10-point score by the total number of questions, displaying incorrect percentages and confusing fraction formats (e.g., 8 / 20 points = 40%).

**Independent Test**: Complete a 20-question exam answering 16 correctly. Verify that the API returns `score: 8.0`, `correct_count: 16`, `total_questions: 20`, and the review UI shows `8.0 / 10 Điểm`, `16 / 20 Câu đúng`, và thanh đo 80%. Verify questions match the student's attempt shuffle snapshot.

**Acceptance Scenarios**:
1. **Given** a submitted attempt with 16 correct out of 20 questions, **When** fetching the attempt review via `GET /api/v1/attempts/{id}/review`, **Then** the response includes `score: 8.0`, `correct_count: 16`, `total_questions: 20`, and questions ordered according to `shuffle_snapshot`.
2. **Given** the review page `/history/[attemptId]/review`, **When** the page renders, **Then** the radial score indicator calculates percentage as `(score / 10.0) * 100`, the score displays `/ 10 ĐIỂM`, and an info badge displays `/ {total_questions} CÂU ĐÚNG`.
3. **Given** the option correctness Zod schema, **When** `is_correct` is `null` (unrevealed or locked), **Then** parsing succeeds without crashing the page.

---

### User Story 2 - Enforcement of Max Attempts & Resuming In-Progress Attempts (Priority: P1)

As a student opening an exam that I already have an ongoing attempt for, I want to be informed of my in-progress session and have the option to Resume where I left off or Abandon it and start fresh (if remaining attempts permit), and if I have exhausted my `max_attempts`, the system must prevent starting new attempts.

**Why this priority**: Eliminates orphaned attempts, accidental multiple starts, and prevents students from bypassing the exam's allowed attempt count.

**Independent Test**: Configure an exam with `max_attempts: 1`. Start an attempt, navigate away, and return to `/exams/[id]`. Verify a banner indicates an active attempt with "Tiếp tục làm bài" (Resume) and "Làm lại từ đầu" buttons. Verify starting a 2nd attempt after completing the 1st throws `403 MaxAttemptsReachedException`.

**Acceptance Scenarios**:
1. **Given** a student with an active `IN_PROGRESS` attempt where `now < expires_at`, **When** visiting `/exams/[id]`, **Then** the UI displays an active attempt prompt showing remaining time, with a primary "Tiếp tục làm bài" button and a secondary "Bắt đầu lại" button.
2. **Given** the student clicks "Tiếp tục làm bài", **When** action executed, **Then** router redirects to `/exams/[id]/attempt/[attemptId]` and restores previously saved answers.
3. **Given** the student clicks "Bắt đầu lại", **When** they still have attempts left under `max_attempts`, **Then** the previous attempt is marked `ABANDONED` and a new attempt is created.
4. **Given** the student has reached `max_attempts` completed/abandoned attempts, **When** attempting to start a new session, **Then** the backend rejects with `MaxAttemptsReachedException` (HTTP 403) and the frontend disables the start button with an explanatory message.

---

### User Story 3 - Resilient Anti-Cheat with 2.0s Mouse-Leave Grace Window (Priority: P2)

As a student taking an exam on a desktop or laptop, I want minor incidental mouse movements outside the browser boundary (e.g., hovering near the taskbar, dock, or second monitor) to NOT immediately trigger a severe strike or auto-submit my exam, provided my cursor returns within 2 seconds.

**Why this priority**: Eliminates false-positive auto-submissions caused by incidental cursor movements while retaining robust detection against deliberate multi-tasking or tab-switching.

**Independent Test**: Move mouse outside the browser viewport for 1.2 seconds and bring it back. Verify no violation modal or backend focus event is triggered. Then move mouse outside for 2.5 seconds. Verify a `mouse_leave` violation event is triggered after the 2-second threshold.

**Acceptance Scenarios**:
1. **Given** an active exam session, **When** `mouseleave` occurs, **Then** a 2000ms grace timer starts; if `mouseenter` occurs before 2000ms, the timer is cleared with 0 violations logged.
2. **Given** the cursor remains outside for > 2000ms, **When** the timer fires, **Then** the violation modal displays, a focus event is transmitted to the server, and `tab_out_count` increments.
3. **Given** a student on macOS, **When** pressing `Cmd+Option+I` or `Cmd+Shift+C` or `Cmd+P` or `Cmd+U`, **Then** default actions are intercepted and prevented.
4. **Given** a violation modal is dismissed, **When** entering fullscreen asynchronously, **Then** heartbeat checks wait for fullscreen stabilization (3-second cooldown) to avoid double-striking.

---

### User Story 4 - Strict Expiration Window with 60s Grace Period (Priority: P2)

As a student submitting near the deadline, I want a 60-second grace window to absorb network latency when submitting at 00:00, but as an educator, I want the system to reject any answer patching after the official deadline has passed.

**Why this priority**: Ensures fair timing constraints, prevents offline answer modifications after time expires, while preventing network flakiness from rejecting legitimate on-time submissions.

**Independent Test**: Attempt to patch answers after `expires_at + 10s`. Verify HTTP 400 Bad Request ("Attempt expired"). Attempt to submit at `expires_at + 45s`. Verify submission succeeds (`COMPLETED`). Attempt to submit at `expires_at + 90s`. Verify attempt is marked `TIMED_OUT` with answers frozen up to expiration.

**Acceptance Scenarios**:
1. **Given** an attempt where `now_ict() > att.expires_at + timedelta(seconds=10)`, **When** calling `PATCH /attempts/{id}/answers`, **Then** the backend rejects with HTTP 400.
2. **Given** an attempt submitted within `expires_at + 60s`, **When** calling `POST /attempts/{id}/submit`, **Then** the status is marked `COMPLETED` and scored normally.
3. **Given** an attempt submitted after `expires_at + 60s`, **When** calling submit, **Then** the attempt is finalized with status `TIMED_OUT` (or `COMPLETED` with timeout flag) and scored based on persisted answers.

---

### User Story 5 - Clean Code, N+1 Query Elimination & Modular Exam UI (Priority: P3)

As a developer maintaining the platform, I want bulk fetching for questions during attempt retrieval (`GetAttemptUseCase`), a secure access check in `ExamEntity`, and a decomposed frontend test environment so that the codebase is performant, testable, and maintainable.

**Why this priority**: Fixes existing N+1 SQL queries during exam startup/reconnect, closes unauthenticated access holes in `can_access`, and modularizes the 617-line god component.

**Independent Test**: Load an attempt with 50 questions; verify SQL queries execute in a single bulk `IN (...)` query rather than 50 separate select statements. Inspect component directory to verify subcomponents (`ExamTimer`, `QuestionPalette`, `QuestionCard`, `SubmitModal`).

**Acceptance Scenarios**:
1. **Given** `GetAttemptUseCase.execute`, **When** loading questions for presentation, **Then** repository uses `get_by_ids([UUID, ...])` in a single query.
2. **Given** `ExamEntity.can_access(user_id=None)`, **When** `access_scope == RESTRICTED`, **Then** the function returns `False`.
3. **Given** `TestEnvironmentPage`, **When** inspected, **Then** code is refactored into dedicated hooks (`useExamTimer`, `useExamSession`) and components with < 200 lines per file.

---

## Edge Cases

- **Student disconnects during auto-submit**: If `tab_out_count >= 3`, event bus publishes `AttemptViolationEvent` which submits server-side immediately; subsequent reconnect redirects to review or result page.
- **Clock Skew on Client**: Server provides `server_time` or `expires_at` in ISO 8601 ICT; frontend computes delta against server response timestamp rather than relying solely on client local clock.
- **Multiple Tabs of Same Attempt**: When another tab opens or focuses, anti-cheat triggers `window_blur` / `poll_loss_focus`.
- **Zero Questions Exam**: Backend returns `ExamNoQuestionsException` (HTTP 400); frontend displays user-friendly empty state instead of infinite loading.
- **Unauthenticated Restricted Exam**: `can_access(None)` returns `False`, rejecting unauthorized anonymous calls.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Backend MUST return both `score` (float, scale 10), `correct_count` (int), and `total_questions` (int) in `AttemptEntity.score_attempt`, `AttemptOut`, and `ReviewAttemptUseCase`.
- **FR-002**: Backend `StartAttemptUseCase` MUST check existing user attempts for the exam against `exam.max_attempts`. If limit reached, it MUST raise `MaxAttemptsReachedException` (HTTP 403).
- **FR-003**: Backend MUST provide an endpoint or query to detect an active `IN_PROGRESS` attempt for a given `exam_id` and `user_id`.
- **FR-004**: Frontend `/exams/[id]` MUST display a "Tiếp tục bài thi" (Resume) button if an active attempt is in progress, and allow abandoning it if starting a new attempt.
- **FR-005**: Backend `PatchAttemptAnswersUseCase` MUST reject updates if `now_ict() > att.expires_at + 10s`.
- **FR-006**: Backend `SubmitAttemptUseCase` MUST enforce a 60-second grace window after `att.expires_at`; submissions beyond grace period MUST be recorded as timed out.
- **FR-007**: Backend `ReviewAttemptUseCase` MUST reconstruct question and option orders using `att.shuffle_snapshot.reconstruct_presentation` so student sees the exact sequence taken.
- **FR-008**: Backend `ExamEntity.can_access` MUST return `False` if `user_id is None` and `access_scope == ExamAccessScope.RESTRICTED`.
- **FR-009**: Backend `IQuestionRepository` MUST support `get_by_ids(ids: list[UUID])` to resolve N+1 queries.
- **FR-010**: Frontend `useAntiCheat` MUST implement a 2000ms cancellation buffer for `mouseleave` events.
- **FR-011**: Frontend `useAntiCheat` MUST block macOS shortcuts using `e.metaKey`.
- **FR-012**: Frontend review page MUST format score display as `{score} / 10 ĐIỂM` and show `{correct_count} / {total_questions} CÂU ĐÚNG`.
- **FR-013**: Frontend `types.ts` `AttemptReviewResponseSchema` MUST allow `is_correct` to be `null` or `undefined` without validation errors.

---

### Key Entities

- **AttemptEntity**:
  - `id`: UUID
  - `exam_id`: UUID
  - `user_id`: int
  - `started_at`: datetime
  - `completed_at`: datetime | None
  - `expires_at`: datetime
  - `score`: float | None (Thang điểm 10, e.g., 8.5)
  - `correct_count`: int | None (Số câu đúng)
  - `total_questions`: int | None (Tổng số câu)
  - `status`: AttemptStatus (IN_PROGRESS, COMPLETED, TIMED_OUT, ABANDONED)
  - `tab_out_count`: int
  - `shuffle_seed`: int
  - `shuffle_snapshot`: ShuffledSnapshot

- **ShuffledExamResult / ShuffledSnapshot**:
  - `question_order`: list[str]
  - `options_order`: dict[str, list[str]]

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of exam reviews display consistent score formatting (`X.X / 10 ĐIỂM`) and correct answer count (`Y / Z CÂU ĐÚNG`) with zero NaN or erroneous percentage calculations.
- **SC-002**: Zero attempts can be started once a user has reached `max_attempts` for that exam.
- **SC-003**: 0% false-positive strikes for mouse cursor leaves lasting under 2.0 seconds.
- **SC-004**: Database roundtrips for loading an attempt reduced from `O(N)` queries to `O(1)` bulk query (`get_by_ids`).
- **SC-005**: 100% of answer patches after `expires_at + 10s` are blocked with HTTP 400.
