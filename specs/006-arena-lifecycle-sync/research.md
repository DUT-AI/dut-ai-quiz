# Research & Architectural Decisions: Arena Lifecycle & Turn Synchronization

**Feature**: `006-arena-lifecycle-sync`
**Date**: 2026-10-24

## 1. Problem Statement & Root Cause

The frontend encountered error toasts: `"Question ID does not match current question index"` when players submitted answers or when automated actions (timeouts/item usage) occurred.

### Root Cause Analysis
1. **Asynchronous Index Drift**:
   - Backend `advance_question` moves `gamification.last_question_index = N + 1` upon recording answer $N$.
   - Client updates `gamification` state to $N + 1$ immediately, while UI `currentIdx` remains $N$ pending user click on "TIẾP TỤC HÀNH TRÌNH".
   - If user clicks rapidly, or if timeout fires concurrently, or if an item is activated, the request sends `question_id = Question N`, but backend checks against `questions[gamification.last_question_index]` (Question $N + 1$).
2. **Double Submission / Race Conditions**:
   - State updates in React are queued. Rapid clicks trigger multiple `submitAnswer` calls within the same execution frame before `isAnswered` or `isPending` state blocks them.
3. **Question Snapshot Sanitization Leaks**:
   - `sanitize_game_snapshot` blanks all questions except `last_question_index`. When client called `refetchActiveSession()` to advance to the next question, replacing the questions array wiped out previous questions and relied on a potentially stale or network-delayed response.

---

## 2. Key Decisions

### Decision 1: Domain-Level Idempotency for Answer Submission
- **Decision**: In `PatchGameAnswerUseCase`, check if `str(payload.question_id) in snap.answers`. If it is already answered, return the recorded gamification state and correctness result cleanly (`is_game_over`, `correct_option_id`) with 0 additional point gains, rather than raising `DomainValidationException("Question ID does not match current question index")`.
- **Rationale**: Network retries, double taps, or near-timeout submissions must be idempotent. A gaming session should never show an error toast when the user submitted a valid answer.
- **Alternatives Considered**: Reject with 409 Conflict. Rejected because client would still display an error toast and degrade player experience.

### Decision 2: Single Source of Truth & Synchronized Locks in Frontend
- **Decision**:
  1. Add an immediate synchronous lock (`isSubmittingRef = useRef(false)`) in `useGameTurn`. Any call to `submitAnswer` or `handleTimeOut` checks and sets this ref synchronously.
  2. Guard `handleTimeOut` so that if `isAnswered || isSubmittingRef.current` is true, it immediately early-returns.
  3. Reset `isSubmittingRef.current = false` only when advancing to the next question (`nextQuestion`) or on submission error.
- **Rationale**: Eliminates race conditions before React re-render cycles trigger.
- **Alternatives Considered**: Relying only on `patchAnswerMutation.isPending`. Rejected because React mutation state transitions are not instant across microtasks.

### Decision 3: Preserving Question Contents in Memory
- **Decision**: When `nextQuestion` runs, merge incoming question snapshots with existing questions in memory so previously loaded questions retain their content and options.
- **Rationale**: Protects against snapshot sanitization wiping previous questions if the user reviews progress or during animation transitions.

---

## 3. Compatibility & Performance

- **Zero Breaking Changes**: Does not alter database schemas or table structures (`practice_sessions`, `questions`).
- **Performance**: Eliminates redundant error handlers and prevents network thrashes from double submissions.
