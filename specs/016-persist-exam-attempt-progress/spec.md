# Feature Specification: Resilient Exam Attempt Progress & Instant Sync on Refresh

**Feature Branch**: `016-persist-exam-attempt-progress`

**Created**: 2026-11-07

**Status**: Ready for Planning

**Input**: User description: "Hiện tại tôi thấy có 1 vấn đề là mỗi lần thí sinh có vấn đề phải F5 thoát ra vào lại thì bị mất tiến trình bài thi, hãy xem xét vấn đề và đưa ra giải pháp"
- Clarification Decisions:
  1. **Network Sync Strategy**: Synchronous local write (`localStorage`) ngay lập tức trên từng click + Debounce gom 300ms gửi server + Bắt sự kiện `beforeunload` để flush ngay các câu chưa gửi qua `fetch(..., { keepalive: true })` hoặc `navigator.sendBeacon`.
  2. **Reload Tolerance Anti-Cheat Policy**: Cơ chế cờ ân hạn reload (`sessionStorage` 10s grace period) để triệt tiêu các sự kiện blur/focus kích hoạt bởi F5, không phạt nhầm số lần thoát tab khi thí sinh chỉ tải lại trang.

---

## Problem Diagnosis (Root Cause Analysis)

1. **Debounce Lag (1500ms Delay)**: Trong [`useExamSession.ts`](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/features/attempts/hooks/useExamSession.ts#L41-L59), khi thí sinh click chọn đáp án, hệ thống lưu tạm trong state React `answers` và chờ 1.5 giây mới gửi API `PATCH /attempts/{id}/answers`. Nếu thí sinh F5 / tải lại trang ngay sau khi click, sự kiện `beforeunload` không kịp hoàn thành gửi dữ liệu mạng không đồng bộ $\rightarrow$ những câu vừa làm chưa kịp lưu vào database.
2. **Thiếu Local Fallback Storage (`localStorage`)**: Trình duyệt không sao lưu tức thì (`synchronous write`) trạng thái chọn đáp án vào `localStorage`. Khi F5 diễn ra, toàn bộ state trong bộ nhớ RAM bị reset; nếu API server chưa kịp nhận gói tin, tiến trình bị mất trắng.
3. **Phạt nhầm vi phạm Anti-Cheat khi Reload**: Khi thí sinh ấn F5, trình duyệt kích hoạt sự kiện `beforeunload` / `unload` / `window_blur`, khiến hook `useAntiCheat` gửi sự kiện vi phạm `window_blur` / `mouse_leave`. Thí sinh vô tình bị cộng thêm `tab_out_count` và thậm chí bị tự động nộp bài (0 điểm) nếu trước đó đã có cảnh báo. Khi bài thi bị `AUTO_SUBMITTED`, status chuyển thành `COMPLETED` và server chặn mọi thao tác lưu bài tiếp theo.
4. **Backend Resume Attempt thiếu `saved_answers`**: Khi thí sinh quay lại trang `/exams/[id]` và nhấn "Tiếp tục làm bài", API `POST /api/v1/exams/{exam_id}/attempts` (`StartAttemptUseCase`) khôi phục lượt thi dở nhưng KHÔNG tải và trả về danh sách `saved_answers` trong `StartAttemptOut`.
5. **Không phục hồi vị trí câu hỏi đang làm dở (`currentIndex`)**: Khi F5 hoặc vào lại, hệ thống luôn đưa thí sinh về câu hỏi số 1 thay vì câu hỏi cuối cùng thí sinh đang dừng lại.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Local & Server Dual-Sync on Answer Selection (Priority: P1)

As a student taking an exam, when I select an option for any question, I want my choice to be immediately preserved both in local browser storage and dispatched promptly to the server, so that if my browser crashes, page reloads (F5), or my internet flickers, I do not lose any of my answered questions.

**Why this priority**: Eliminates student anxiety and data loss when technical hiccups or page reloads occur during high-stakes exams.

**Independent Test**: Can be tested by answering 5 questions, immediately pressing F5 without waiting, and verifying that upon page reload, all 5 answers are restored exactly as selected.

**Acceptance Scenarios**:

1. **Given** a student is answering questions in an active attempt, **When** they click an option, **Then** the answer is immediately written synchronously to `localStorage` under `exam_progress_{attempt_id}`, and scheduled for server dispatch via a 300ms debounce window.
2. **Given** un-synced answers exist in memory when the student reloads (F5) or closes the tab, **When** `beforeunload` triggers, **Then** the pending answers are flushed immediately using `fetch(path, { keepalive: true })` or `navigator.sendBeacon`.
3. **Given** an attempt page is reloaded (F5), **When** the page initializes, **Then** the UI reconciles answers from both the server's `saved_answers` and `localStorage`, restoring all selected choices seamlessly.

---

### User Story 2 - Safe Page Reload Without Anti-Cheat Penalty (Priority: P1)

As a student experiencing a UI lag or browser freeze, when I refresh the page (F5) or reconnect within the same exam session, I want the system not to penalize me with a false-alarm "Tab-Out" or "Mouse-Leave" anti-cheat violation for the reload itself, so that I am not unfairly auto-submitted with 0 points.

**Why this priority**: Prevents students from being locked out or auto-submitted due to normal page reloads or network reconnects.

**Independent Test**: Can be tested by starting an exam, refreshing the page (F5), and verifying that `tab_out_count` remains 0 (no violation logged for the reload cycle).

**Acceptance Scenarios**:

1. **Given** an active exam attempt, **When** a `beforeunload` event triggers due to a page reload within the exam route, **Then** a temporary "reloading" flag is set in `sessionStorage` with a 10-second expiry window.
2. **Given** the page re-mounts on the same attempt within the reload grace window, **When** initial blur/focus events fire during browser render, **Then** the anti-cheat system suppresses the violation event.

---

### User Story 3 - Restore Last Active Question Index on Resume (Priority: P2)

As a student returning to an ongoing attempt, I want the exam interface to automatically resume at the specific question number I was previously viewing or answering, so that I can immediately continue my exam flow without clicking through previous questions.

**Why this priority**: Streamlines the resume experience and saves valuable exam time.

**Independent Test**: Can be tested by navigating to Question 15, refreshing the page, and confirming that Question 15 is active on reload.

**Acceptance Scenarios**:

1. **Given** a student navigates between questions, **When** they view or answer question N, **Then** the current question index is saved to `localStorage`.
2. **Given** a student reloads or resumes the attempt, **When** questions finish loading, **Then** the active question automatically opens at index N.

---

### Edge Cases

- **Clearing Browser Cache / Incognito**: If a student reloads in incognito or clears browser cache, `localStorage` is empty. The system must gracefully fall back to the server's `saved_answers` returned by `GET /api/v1/attempts/{id}`.
- **Multiple Tabs of Same Exam**: If a student opens the same exam in two tabs, changes in one tab should sync across via `storage` event or last-write-wins without corrupting answers.
- **Attempt Expired while Offline**: If a student is offline when the timer expires, upon reconnecting and reloading, the server rejects late patches and displays the submitted result screen.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST write the student's selected answer synchronously to `localStorage` (`exam_progress_{attempt_id}`) immediately on every click.
- **FR-002**: System MUST reduce the network sync debounce interval from 1500ms to 300ms, and flush pending answers immediately on `beforeunload` using `fetch(..., { keepalive: true })` or `navigator.sendBeacon`.
- **FR-003**: System MUST reconcile and restore answers on attempt page mount by merging server `saved_answers` with local `localStorage` progress.
- **FR-004**: System MUST suppress anti-cheat violation reporting during page reloads using a 10-second `sessionStorage` reload grace marker.
- **FR-005**: System MUST save and restore the `currentIndex` (current question position) across page reloads.
- **FR-006**: Backend `POST /api/v1/exams/{exam_id}/attempts` (resume action) MUST fetch and return `saved_answers` in `StartAttemptOut`.
- **FR-007**: System MUST clean up `localStorage` entries for the attempt upon successful final submission (`COMPLETED`).

---

### Key Entities

- **AttemptAnswer**: The server-side saved answer record (`attempt_id`, `question_id`, `selected_option_id`).
- **LocalExamProgress**: Client-side `localStorage` object containing `{ answers: Record<string, string | null>, currentIndex: number, lastUpdated: number }`.
- **ReloadGraceFlag**: Short-lived client session marker in `sessionStorage` (`reload_grace_{attempt_id}`) indicating an in-flight page reload to suppress anti-cheat false alarms.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of selected answers are preserved when a student refreshes (F5) the browser immediately (< 100ms) after selecting an option.
- **SC-002**: 0 false-positive tab-out violations recorded when a student executes a page reload (F5) within an active attempt.
- **SC-003**: Question index restoration time on page load is 0ms (immediate upon question rendering).
- **SC-004**: Zero orphaned storage leaks: 100% of attempt progress keys are cleared from `localStorage` upon exam submission.

---

## Assumptions

- Modern web browsers support `localStorage` (5MB quota is more than sufficient for storing answer maps of hundreds of questions).
- The server's `GET /api/v1/attempts/{id}` endpoint already returns `saved_answers` (verified in codebase).
- Anti-cheat protection remains strictly enforced for external tab switching, minimizing browser, and secondary monitors.
