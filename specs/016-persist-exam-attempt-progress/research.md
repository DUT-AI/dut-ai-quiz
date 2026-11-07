# Research: Resilient Exam Progress & Safe Page Reload

## Problem Analysis

### 1. Debounce and Flush Strategy
- **Current implementation**: `useExamSession.ts` has a 1500ms `setTimeout` debounce on `answers` state changes. If a user answers question N and hits F5 500ms later, the timeout is cleared and unmounted before dispatching `PATCH /attempts/{id}/answers`.
- **Solution**:
  - Reduce debounce to 300ms.
  - On every answer change, write immediately to `localStorage` key `exam_progress_${attemptId}`: `{ answers: Record<string, string | null>, currentIndex: number, lastUpdated: number }`.
  - In `beforeunload` listener, check if there are pending unsaved answers. If yes, flush via `fetch('/api/v1/attempts/' + attemptId + '/answers', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ answers: payload }), keepalive: true })`. `fetch(..., { keepalive: true })` works reliably in modern Chromium, Firefox, and WebKit without size limits of `navigator.sendBeacon` and retains auth cookies.

### 2. State Reconciliation on Page Reload
- When user opens or reloads `/exams/[id]/attempt/[attemptId]`:
  - `useAttempt` returns `data?.saved_answers`.
  - Check `localStorage` for `exam_progress_${attemptId}`.
  - Merge: If `localStorage` has answers, merge them with `saved_answers`. `localStorage` takes precedence if timestamp/selection is newer, ensuring no loss even if the keepalive request was still in-flight or offline.
  - Once user submits exam (`COMPLETED`), clean up `localStorage.removeItem(`exam_progress_${attemptId}`)`.

### 3. Anti-Cheat Reload Tolerance
- **Current implementation**: `useAntiCheat` listens to `blur` and `mouseleave`. On F5, the browser deactivates the window or triggers `blur` before unmounting. This causes `handleViolation("window_blur")` to immediately fire, logging an event and potentially auto-submitting the exam.
- **Solution**:
  - In `beforeunload`, record a short-lived reload timestamp in `sessionStorage`: `sessionStorage.setItem(`exam_reload_grace_${attemptId}`, String(Date.now()))`.
  - In `useAntiCheat`, during mount, check `sessionStorage.getItem(`exam_reload_grace_${attemptId}`)`.
  - If `Date.now() - timestamp < 10000` (10 seconds grace period):
    - Suppress violations and extend `stabilizedAtRef.current` by 5-10 seconds so initial mount and rendering won't trigger blur/mouseleave.
    - Clean up `sessionStorage` after handling or expiring.
  - Also in `beforeunload`, set an in-memory ref `isUnloadingRef.current = true` to immediately ignore any blur/visibilitychange that fires during the teardown of the current page.

### 4. Current Question Index Restoration
- In `page.tsx`:
  - Save `currentIndex` to `localStorage` when user navigates questions.
  - On load, initialize `currentIndex` from `localStorage` (clamped between 0 and `questions.length - 1`).
