# Feature Specification: Teacher View Attempt Details & Delete/Reset Attempt

**Feature Branch**: `015-manage-exam-attempts`

**Created**: 2026-11-07

**Status**: Ready for Planning

**Input**: User description: "Tôi muốn làm 1 chức năng có thể xem chi tiết bài làm của học sinh và có thể xóa lược làm đó để bạn có thể làm lại"
- Clarification Decisions:
  1. Deletion Strategy: Hard delete (`attempts`, cascading `attempt_answers` and `focus_events`). Clean refund of student attempt slots without extra DB migrations.
  2. UI Presentation: Dedicated standalone page at `/teacher/stats/[id]/students/[student_id]` with direct sharable URL, breadcrumbs back to exam stats, and full attempt history review.

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Teacher Inspects Student Exam Attempts on Dedicated Page (Priority: P1)

As a teacher/educator analyzing exam results on the Exam Statistics page (`/teacher/stats/[id]`), I want to click on any student card in the candidate list to navigate to a dedicated page (`/teacher/stats/[id]/students/[student_id]`), where I can see all of that student's attempts, view question-by-question answer breakdowns (selected options, correct options, correctness indicators), inspect anti-cheat focus logs, and share or bookmark the student's unique result URL.

**Why this priority**: Teachers currently have zero visibility into what questions a student answered or why they received 0 points or N/A. A dedicated page provides ample space for in-depth analysis, side-by-side attempt comparisons, and bookmarkable links.

**Independent Test**: Can be tested by navigating to `/teacher/stats/[id]`, clicking a student, verifying redirection to `/teacher/stats/[id]/students/[student_id]`, and confirming that all attempts, question options, selected answers, and focus events are clearly rendered.

**Acceptance Scenarios**:

1. **Given** a teacher is on `/teacher/stats/[id]`, **When** they click on a student's card in the "Thí sinh" tab, **Then** the browser navigates to `/teacher/stats/[id]/students/[student_id]`.
2. **Given** the teacher is on `/teacher/stats/[id]/students/[student_id]`, **When** the page loads, **Then** they see student metadata (avatar, name, email), a breadcrumb link to return to the exam stats page, and a list of all attempts by this student for this exam.
3. **Given** an attempt is selected, **When** the teacher inspects the questions list, **Then** each question displays the prompt, all options, which option the student selected, which option was correct, and whether it was correct, incorrect, or left blank.
4. **Given** an attempt recorded anti-cheat focus events (e.g., `mouse_leave`, `window_blur`), **When** the teacher views the anti-cheat timeline, **Then** each event is listed with its violation type, exact timestamp, and cumulative violation count.

---

### User Story 2 - Teacher Hard Deletes an Attempt to Grant Retake (Priority: P2)

As a teacher/educator, I want to delete a specific attempt of a student directly from the student's detail page (for example, when an attempt was submitted prematurely due to false-alarm tab-outs, browser crashes, or student mistakes), so that the attempt and its answers/events are completely wiped from the database and the student can take the exam again cleanly.

**Why this priority**: Solves the lockout problem where students who experienced accidental anti-cheat triggers or technical glitches cannot retake the test because their max attempts are exhausted.

**Independent Test**: Can be tested by deleting an attempt of a student who reached max attempts, verifying that the database record, its answers, and focus events are deleted, the student attempt count decrements by 1, and the student can immediately start a fresh exam attempt.

**Acceptance Scenarios**:

1. **Given** an authorized educator viewing an attempt on `/teacher/stats/[id]/students/[student_id]`, **When** they click the "Xóa lượt thi này" button, **Then** a modal dialog prompts for confirmation, clearly warning that the attempt and answers will be permanently deleted.
2. **Given** the teacher confirms deletion, **When** the deletion request succeeds, **Then** the attempt is hard-deleted from the database (along with cascading `attempt_answers` and `focus_events`), a success toast is shown, and the attempt list on the page updates immediately.
3. **Given** an attempt has been deleted, **When** the student accesses the exam taking page, **Then** their used attempts count reflects the deletion and they are permitted to start a new exam attempt.
4. **Given** an attempt has been deleted, **When** anyone views `/teacher/stats/[id]`, **Then** the summary metrics (average score, total completions, score distribution bins) automatically reflect the updated dataset without stale figures.

---

### User Story 3 - Role-Based Access Control on Student Attempt Data (Priority: P3)

As an administrator or exam creator, I want only authorized educators (exam owner, educators, admins) to view detailed student answers or delete attempts, so that students or unauthorized users cannot peek at classmates' answers or tamper with exam records.

**Why this priority**: Protects academic integrity, privacy of student responses, and security of exam grading data.

**Independent Test**: Can be tested by attempting to access `/teacher/stats/[id]/students/[student_id]` or sending a `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}` request with a student account, verifying a 403 Forbidden rejection.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user or student account, **When** they attempt to load `/teacher/stats/[id]/students/[student_id]` or call the delete API, **Then** the system denies access with a 403 Forbidden status.
2. **Given** an authorized educator, **When** they perform a deletion, **Then** an audit log entry records the educator's ID, the student's ID, and the deleted attempt ID.

---

### Edge Cases

- **Student has multiple attempts**: If a student has 2 attempts (Attempt 1: 4.0 points, Attempt 2: 0.0 points), deleting Attempt 2 must preserve Attempt 1, and the student's `best_score` must seamlessly become 4.0.
- **Deleting the student's only attempt**: If a student had only 1 attempt and it is deleted, the student's record in `/teacher/stats/[id]` should disappear from participants list (or show 0 attempts / N/A), and overall exam stats must adjust accordingly.
- **Attempt currently `IN_PROGRESS`**: If a teacher deletes an ongoing attempt while the student is still inside the exam screen, any subsequent answer patch or submit call by that student must return a 404/expired error indicating the attempt no longer exists.
- **Concurrent deletion**: If the delete button is double-clicked or requested concurrently, the backend must process the first request idempotently and return 404 Not Found for subsequent calls without 500 server crashes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide an educator endpoint `GET /api/v1/exams/{exam_id}/students/{user_id}/attempts` returning all attempts of the specified student for that exam, including status, scores, timestamps, focus event summaries, and detailed question answer lists (selected option vs correct option).
- **FR-002**: System MUST provide an educator endpoint `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}` that hard deletes the attempt and cascades deletion to `attempt_answers` and `focus_events`.
- **FR-003**: System MUST verify that only authorized educators (exam owner, educator role, or admin) can access student attempt details and execute deletions.
- **FR-004**: Frontend MUST render a dedicated page at `/teacher/stats/[id]/students/[student_id]` with breadcrumb navigation back to `/teacher/stats/[id]`.
- **FR-005**: Frontend MUST provide a clear confirmation dialog before sending the delete request, preventing accidental clicks.
- **FR-006**: Frontend MUST invalidate relevant React Query caches (`["exam-stats", examId]`, `["student-attempts", examId, studentId]`, `["exam-attempts", examId]`) upon successful deletion to ensure UI synchronicity.
- **FR-007**: When displaying question review, questions MUST be reconstructed according to the attempt's `shuffle_snapshot` (if present) so the teacher sees the exact order and choices presented to the student.

---

### Key Entities

- **Attempt**: Represents a student's exam session. Attributes: `id`, `exam_id`, `user_id`, `status` (`IN_PROGRESS`, `COMPLETED`, `ABANDONED`), `score`, `tab_out_count`, `started_at`, `completed_at`, `shuffle_snapshot`.
- **AttemptAnswer**: The specific answer selected by the student. Cascaded upon Attempt deletion.
- **FocusEvent**: Chronological anti-cheat detection logs (`mouse_leave`, `window_blur`, etc.). Cascaded upon Attempt deletion.
- **ExternalUser**: The student's external profile (`user_id`, `name`, `email`, `avatar_url`).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Teachers can navigate from the exam candidate overview to a student's full attempt detail page in 1 click.
- **SC-002**: Attempt deletion completes and cascades cleanly in under 500ms on the backend.
- **SC-003**: A student whose attempt is deleted can start a new attempt immediately without requiring system restart or cache clearing.
- **SC-004**: 100% of exam summary metrics (average score, completed count, 10-bin score distribution) update automatically after deletion without page reload.
- **SC-005**: 0 unauthorized users can view another student's answer sheets or execute attempt deletions.

---

## Assumptions

- Deleting an attempt is a permanent administrative reset (Hard delete) intended for resolving false-positive anti-cheat blocks, technical disruptions, or giving students a legitimate retake opportunity.
- The teacher stats page candidate card will link directly to `/teacher/stats/[id]/students/[student_id]`.
- Existing `IAttemptRepository` and `IAttemptAnswerRepository` will be extended with the delete operation supporting cascading constraints.
