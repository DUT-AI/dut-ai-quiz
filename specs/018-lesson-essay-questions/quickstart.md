# Quickstart Validation Guide: Lesson Essay Questions & Reference Answers

**Feature**: `018-lesson-essay-questions`  
**References**: [spec.md](spec.md) | [data-model.md](data-model.md) | [lesson-essay-questions-api.yaml](contracts/lesson-essay-questions-api.yaml)

---

## Prerequisites

1. PostgreSQL database running:
   ```bash
   make db-up
   ```
2. Database migrations applied (including the `lesson_essay_questions` migration):
   ```bash
   make migrate
   ```
3. Backend API running on `:8000` and frontend contracts synchronized:
   ```bash
   make api-dev
   # In a second terminal (while API is running):
   make generate-api
   ```
4. Frontend web server running on `:3000`:
   ```bash
   make dev-web
   ```

---

## Automated Verification Commands

Run the full quality gate suite required by Constitution Principle IV:

```bash
# Backend unit & integration tests (including lesson essay questions)
cd apps/api && uv run pytest test/test_lesson_essay_questions.py -v
make test

# Static analysis, linting, and TypeScript verification
make lint
make type-check
make check
```

**Expected Outcome**: All Pytest cases pass, `ruff` reports zero issues, ESLint passes with zero errors, and `tsc --noEmit` exits with code `0`.

---

## End-to-End Manual Validation Scenarios

### Scenario 1 — Educator Authors, Previews, Reorders, and Saves Essay Questions (US2)

1. Sign in as an Educator or Admin and navigate to `/teacher/lessons` -> open any existing lesson for editing (`/teacher/lessons/{id}/edit`).
2. Advance to **Step 4: Câu hỏi tự luận** in the lesson editor stepper.
3. Try clicking "Thêm câu hỏi" with empty or whitespace-only question or answer fields.
   - **Expected**: Inline validation error blocks submission; no empty item is added.
4. Add Question 1 using Markdown containing a heading, a bullet list, and inline math (e.g., `$O(n \log n)$`) and a Reference Answer containing a fenced code block and a Markdown table.
5. Toggle the live Markdown preview (and check the split preview panel).
   - **Expected**: Both question and reference answer render formatted Markdown accurately before saving.
6. Add Question 2 containing a Mermaid diagram block in the answer, then move Question 2 above Question 1 using the reorder button.
7. Click **"Cập nhật bài học"** (Save).
   - **Expected**: Lesson saves cleanly without errors; reopening `/teacher/lessons/{id}/edit?step=4` displays both questions in the updated order with exact Markdown preserved.

### Scenario 2 — Learner Views Dedicated Tab & Toggles Reference Answers (US1 & US3)

1. Sign in as a Learner and open `/lessons/{slug}`.
2. Click the **"Câu hỏi tự luận"** tab in the lesson navigation bar (navigates to `/lessons/{slug}/essay`).
   - **Expected**:
     - The "Câu hỏi tự luận" tab highlights as active.
     - Both essay questions render in the educator's saved order.
     - **100% of reference answers are hidden by default** (no answer text input box is shown).
3. Click **"Hiển thị đáp án"** on Question 1.
   - **Expected**: Question 1's reference answer expands smoothly (< 1s, no reload) with formatted code blocks/tables/math; button changes to **"Ẩn đáp án"**; Question 2's answer remains hidden.
4. Click **"Hiện tất cả đáp án"**, then **"Ẩn tất cả đáp án"**.
   - **Expected**: All answers expand together, then collapse together cleanly.
5. Navigate away to the "Lý thuyết" tab and return to "Câu hỏi tự luận".
   - **Expected**: All reference answers reset to hidden.

### Scenario 3 — Empty State, Security & Cascade Integrity (Edge Cases)

1. **Empty State**: Open `/lessons/{slug-without-essays}/essay` for a lesson with zero essay questions.
   - **Expected**: Friendly empty state ("Chưa có câu hỏi tự luận cho bài học này") with a button back to Theory.
2. **Markdown Sanitization**: Save a test question/answer containing `<script>alert('xss')</script>` or `<img src=x onerror=alert(1)>` and view it on `/lessons/{slug}/essay`.
   - **Expected**: No script executes; unsafe tags/attributes are neutralized while valid Markdown/KaTeX/Mermaid render normally.
3. **Authorization Check**: While authenticated as a Learner, send `PUT /api/v1/lessons/{lesson_id}/essay-questions`.
   - **Expected**: HTTP `403 Forbidden`.
4. **Cascade Deletion**: Delete a temporary test lesson that has essay questions attached.
   - **Expected**: All associated rows in `lesson_essay_questions` are automatically removed with zero orphans.
5. **Save Failure Resilience**: Simulate a network/API failure while saving Step 4 in `LessonEditorPage`.
   - **Expected**: Clear error toast is shown and the educator stays on the editor page with all typed Markdown edits preserved.
