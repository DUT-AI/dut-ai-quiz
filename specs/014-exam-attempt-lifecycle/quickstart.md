# Quickstart & Verification Guide: Exam Attempt Lifecycle

**Feature**: `014-exam-attempt-lifecycle`  
**Date**: 2026-11-07  

## 1. Prerequisites & Environment

Ensure backend and frontend dependencies are installed and test databases are migrated:

```bash
# Backend verification
cd apps/api
uv run alembic upgrade head
uv run pytest test/

# Frontend verification
cd ../../apps/web
npm run type-check
npm run lint
```

---

## 2. Verification Scenarios

### Scenario 1: Dual Scoring Representation & Review Rendering

**Goal**: Verify that an attempt produces both a 10-point scale score and raw correct count, and renders accurately without percentage inversion.

1. Create an exam with 20 questions.
2. Start an attempt via `POST /api/v1/exams/{exam_id}/attempts`.
3. Submit answers with 16 correct options and 4 incorrect options.
4. Submit the attempt via `POST /api/v1/attempts/{attempt_id}/submit`.
5. Verify response payload:
   ```json
   {
     "id": "...",
     "score": 8.0,
     "correct_count": 16,
     "total_questions": 20,
     "status": "COMPLETED"
   }
   ```
6. Open `/history/[attemptId]/review` in browser.
7. **Expected UI**:
   - Radial Score displays `8.0 / 10 ĐIỂM`.
   - Percentage stroke animates to exactly `80%`.
   - Badge displays `16 / 20 CÂU ĐÚNG`.
   - Questions and options appear in the exact randomized sequence the student saw during the exam.

---

### Scenario 2: Max Attempts Enforcement & Resume Active Attempt

**Goal**: Verify that an active attempt can be resumed or restarted, and that `max_attempts` is strictly enforced.

1. Set `max_attempts: 1` on an exam.
2. Start attempt #1 via student account.
3. Navigate back to `/exams/[id]`.
4. **Expected UI**:
   - The entrance page detects the active session and renders a prominent banner: *"Bạn đang có một bài thi chưa hoàn thành"*.
   - Two buttons are visible: **"Tiếp tục làm bài (Resume)"** and **"Làm lại từ đầu"**.
5. Click **"Tiếp tục làm bài"**: Navigates to `/exams/[id]/attempt/[attemptId]`, restoring all answers.
6. Submit attempt #1 (`COMPLETED`).
7. Navigate back to `/exams/[id]`.
8. **Expected UI**:
   - The start button is disabled with text *"Đã đạt số lượt làm bài tối đa (1/1)"*.
   - Direct API call `POST /api/v1/exams/{id}/attempts` returns `HTTP 403 Forbidden` (`MaxAttemptsReachedException`).

---

### Scenario 3: Anti-Cheat 2.0s Mouse-Leave Grace Window

**Goal**: Verify that incidental mouse leaves do not trigger false-positive violations.

1. Open an active exam in fullscreen.
2. Move mouse cursor outside the browser window (to second monitor or desktop edge).
3. Move cursor back into the browser window after **1.2 seconds**.
   - **Expected**: No violation modal appears. `tab_out_count` remains 0.
4. Move mouse cursor outside the browser window and keep it outside for **2.5 seconds**.
   - **Expected**: After 2.0 seconds, the violation modal appears: *"Rời chuột khỏi vùng làm bài"*.
   - A focus event is transmitted to the server. `tab_out_count` becomes 1.
5. On macOS, press `Cmd+Option+I` and `Cmd+P`.
   - **Expected**: Key combinations are intercepted with `e.preventDefault()`; devtools does not dock.

---

### Scenario 4: Expiration Window & Late Patch Rejection

**Goal**: Verify that answers cannot be patched after expiry, and late submissions beyond 60s are handled appropriately.

1. In a test attempt, mock or wait until `now > expires_at + 15s`.
2. Send `PATCH /api/v1/attempts/{id}/answers` with a question answer.
   - **Expected**: HTTP 400 Bad Request (`"Attempt has expired"`).
3. Send `POST /api/v1/attempts/{id}/submit` when `expires_at < now < expires_at + 60s`.
   - **Expected**: HTTP 200 OK, `status: "COMPLETED"`.
4. Send `POST /api/v1/attempts/{id}/submit` when `now > expires_at + 70s`.
   - **Expected**: HTTP 200 OK, `status: "TIMED_OUT"` (or auto-finalized).

---

## 3. Automated Test Suite Execution

Run the targeted test suites covering these behaviors:

```bash
# Run attempt lifecycle unit tests
uv run pytest apps/api/test/test_attempt_use_cases.py -v
uv run pytest apps/api/test/test_scoring.py -v

# Run frontend type and lint validations
cd apps/web && npm run type-check
```
