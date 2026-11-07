# Quickstart & Verification Guide: Manage Student Exam Attempts

**Feature**: `015-manage-exam-attempts`  
**Date**: 2026-11-07  
**Status**: Ready  

---

## Prerequisites

1. Ensure the PostgreSQL database is reachable (check `.env` for `DATABASE_URL`).
2. FastAPI backend running on port 8000 (`uv run uvicorn app.main:app --reload`).
3. Next.js frontend running on port 3000 (`pnpm --filter web dev` or `npm run dev --prefix apps/web`).
4. An educator or admin user account.

---

## Automated Verification

### 1. Backend Verification

Run the test suite verifying attempt deletion cascading and student attempt retrieval:

```bash
# Run backend pytest covering attempt management use cases
uv run pytest apps/api/test/test_manage_student_attempts.py -v
```

Expected output:
- All tests pass (retrieval with shuffle snapshot, cascade deletion of answers/focus events, 403 authorization checks).

### 2. Frontend Contract & Type Integrity

```bash
# Verify TypeScript type-checking across frontend codebase
npm run --prefix apps/web type-check
```

Expected output:
- `tsc --noEmit` exits with code 0.

---

## End-to-End Manual Verification Scenarios

### Scenario 1: Navigate to Student Attempt Details

1. Open browser to `http://localhost:3000/teacher/stats/d0f55af0-c022-4890-b9ff-f1b3cef0ceaf`.
2. Switch to the **"Thí sinh"** tab.
3. Click on any student card (e.g. *Võ Đức Thịnh* or *Võ Nguyễn Đình Dương*).
4. **Verification**:
   - URL navigates to `/teacher/stats/d0f55af0-c022-4890-b9ff-f1b3cef0ceaf/students/[student_id]`.
   - Page displays student header (avatar, name, email), summary badges (total attempts, best score, max tab-out), and breadcrumbs to go back.
   - All attempts by this student are listed with timestamps, statuses, and score tags.

### Scenario 2: Question-by-Question Breakdown Review

1. Select an attempt from the student's attempt list.
2. Inspect the rendered question cards:
   - Green badge for correct answers with the selected option highlighted.
   - Red badge for incorrect answers showing what the student chose vs the correct option.
   - Gray badge for unanswered questions.
3. Check the Anti-Cheat log timeline for any `mouse_leave` or `window_blur` events with exact ICT timestamps.

### Scenario 3: Hard Delete an Attempt to Refund Attempt Slot

1. On the selected attempt card, click the **"Xóa lượt thi này"** button (red button with trash icon).
2. A confirmation modal appears: *"Bạn có chắc chắn muốn xóa vĩnh viễn lượt thi này? Học sinh sẽ được hoàn lại 1 lượt làm bài."*
3. Click **"Xác nhận xóa"**.
4. **Verification**:
   - Toast notification: *"Đã xóa lượt làm bài thành công"*.
   - The attempt disappears immediately from the student's attempt list.
   - Student's `total_attempts` decrements by 1.
   - Click "Quay lại thống kê đề thi" -> The exam overview statistics (`average_score`, `total_completed`, `score_distribution`) reflect the deletion.
   - Log in as the student -> the student can now start a new attempt without being blocked by max attempt limits.
