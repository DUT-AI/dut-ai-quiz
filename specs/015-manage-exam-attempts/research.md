# Research & Technical Decisions: Manage Student Exam Attempts

**Feature**: `015-manage-exam-attempts`  
**Date**: 2026-11-07  
**Status**: Completed  

---

## Technical Decisions & Rationale

### 1. Attempt Deletion & Cascading Strategy

* **Decision**: Hard delete with explicit multi-table transaction in `IAttemptRepository.delete_attempt(attempt_id: UUID)`.
* **Rationale**:
  - The user explicitly confirmed: *"Xóa bản ghi attempt và cascade xóa toàn bộ attempt_answers, focus_events liên quan. Lượt thi được hoàn trả 100% sạch sẽ cho học sinh làm lại, thống kê tự động tính lại ngay lập tức. Đơn giản, triệt để và không tốn thêm migration database."*
  - In PostgreSQL / SQLAlchemy, executing explicit deletions (`delete(AttemptAnswer)`, `delete(FocusEvent)`, `delete(Attempt)`) within a single transaction ensures atomic removal even if database foreign keys lack `ON DELETE CASCADE`.
  - Recalculates `attempts_count`, `best_score`, `max_tab_out`, and exam statistics (`average_score`, `total_completed`, `score_distribution`) dynamically without needing custom invalidation flags.
* **Alternatives Considered**:
  - *Soft Delete (`is_deleted` / `INVALIDATED` status)*: Requires adding an Alembic migration for a new column or enum value, updating all existing queries (`list_all_for_exam`, `leaderboard`, `list_for_user`, `get_exam_stats`) with `where(status != INVALIDATED)`. Rejected due to unnecessary complexity and migration overhead.

---

### 2. Frontend Navigation & Screen Presentation

* **Decision**: Standalone Next.js App Router route at `apps/web/app/(root)/teacher/stats/[id]/students/[studentId]/page.tsx`.
* **Rationale**:
  - The user explicitly requested: *"Chuyển hướng sang một URL mới (ví dụ /teacher/stats/[id]/students/[student_id]). Thích hợp nếu muốn có đường link chia sẻ riêng cho từng học sinh."*
  - Provides a deep-linkable, bookmarkable URL for educators to share or audit specific student results.
  - Generous layout for side-by-side or tabbed multi-attempt review, question-by-question cards, option diffs, and anti-cheat event timeline.
  - Includes a clear breadcrumb back to `/teacher/stats/[id]` preserving exam navigation context.
* **Alternatives Considered**:
  - *Slide-over Sheet / Modal Dialog*: Constrained width for reviewing 40-50 questions with math equations or code blocks, creates scroll-nesting friction on mobile/tablet.

---

### 3. Presentation Reconstruction via `ShuffledSnapshot`

* **Decision**: When rendering questions in the teacher review view, reconstruct questions via `attempt.shuffle_snapshot.reconstruct_presentation(...)` if a snapshot exists; otherwise fall back to canonical question order.
* **Rationale**:
  - Aligns with Constitution Principle V (Authority & In-Memory Presentation).
  - Teachers see the exact question sequence and option order that the student experienced during their exam session, eliminating confusion about option lettering (A, B, C, D).

---

### 4. API Endpoints & Contract Design

* **Decision**:
  - `GET /api/v1/exams/{exam_id}/students/{student_id}/attempts` -> Returns student profile, list of all attempts, question details (selected vs correct option, score per question), and anti-cheat focus events.
  - `DELETE /api/v1/exams/{exam_id}/attempts/{attempt_id}` -> Deletes the attempt, returns confirmation.
* **Rationale**:
  - Clean RESTful design under `/api/v1/exams/{exam_id}` namespace.
  - Governed by `EducatorUser` dependency, ensuring only authenticated educators/admins can access student answer sheets and trigger deletions.

---

### 5. Client State & Cache Invalidation

* **Decision**:
  - React Query mutation hook `useDeleteAttempt(examId, studentId)` invalidates:
    - `["exam-stats", examId]`
    - `["student-attempts", examId, studentId]`
    - `["leaderboard", examId]`
* **Rationale**:
  - Once an attempt is deleted, navigating back to `/teacher/stats/[id]` immediately displays updated metrics without requiring a manual browser refresh.
