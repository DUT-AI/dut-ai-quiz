# Feature Specification: Arena Game Lifecycle and Turn Synchronization

**Feature Branch**: `006-arena-lifecycle-sync`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "tiến hành triển khai giải pháp kiến trúc chuẩn hoá vòng đời Game Arena ngay bây giờ không"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Smooth Continuous Question Answering (Priority: P1)

As an arena player answering a quiz question, I want my submitted answer to be registered smoothly and allow me to advance to the next question with zero mismatch errors or toast alerts, so that my gameplay is uninterrupted and enjoyable.

**Why this priority**: Directly solves the critical bug `"Question ID does not match current question index"`, which currently blocks users from progressing or causes disruptive error toasts during arena play.

**Independent Test**: Can be tested by starting an arena match, answering several questions in succession (both correctly and incorrectly), clicking "TIẾP TỤC HÀNH TRÌNH", and confirming every transition occurs without errors.

**Acceptance Scenarios**:

1. **Given** a player is on Question $N$ with options visible, **When** they click an option, **Then** their answer is recorded, feedback is displayed, and the turn is marked complete without throwing mismatch errors.
2. **Given** Question $N$ has been answered, **When** the player clicks "TIẾP TỤC HÀNH TRÌNH", **Then** the interface transitions to Question $N+1$ with updated contents and refreshed timer immediately.
3. **Given** a player rapid-clicks an option or network experiences jitter, **When** multiple submissions are fired for the same question, **Then** subsequent requests are handled idempotently without displaying error toasts.

---

### User Story 2 - Resilient Timeout and Item Buff Execution (Priority: P2)

As an arena player facing a tough boss or running low on time, I want my timeouts and item usage (50-50, freeze, shield, double points) to strictly synchronize with the active question, so that buffs and penalties apply to the exact question I am looking at.

**Why this priority**: Prevents desynchronization when the timer expires or when items are used near question boundaries or after answering.

**Independent Test**: Can be tested by letting the timer run down to 0 on a question to verify timeout submission, and activating items (e.g. 50-50, Time Freeze) to verify they target the current question without index conflict.

**Acceptance Scenarios**:

1. **Given** the timer reaches 0 on Question $N$, **When** timeout triggers, **Then** timeout is submitted for Question $N$, and if already submitted or answered, duplicate timeout triggers are safely ignored.
2. **Given** Question $N$ has already been answered, **When** the countdown completes or an item button is clicked, **Then** item use and timer events are disabled so no invalid state transitions occur.

---

### User Story 3 - Instant Question Advancement Without Secondary Fetch Latency (Priority: P3)

As an arena player clicking "TIẾP TỤC HÀNH TRÌNH", I want the next question to be ready instantly without waiting for a separate round-trip network query or suffering from stale cache data.

**Why this priority**: Eliminates redundant GET requests and cache desynchronization between TanStack Query and backend session state.

**Independent Test**: Can be tested by inspecting network traffic during question transition to ensure the answer submission response provides the necessary state for advancing to the next question.

**Acceptance Scenarios**:

1. **Given** an answer submission response is received, **When** reviewing payload data, **Then** it contains the updated gamification state and required information to render the subsequent question smoothly.

---

### Edge Cases

- **Double-click / Rapid click**: When a user rapidly taps an answer multiple times before the first request finishes, only the first submission is processed; subsequent submissions return the current valid turn result idempotently.
- **Answer submitted at 0.0s**: When timeout fires at the exact moment a user clicks an option, the system accepts the user's action and disregards the redundant timeout call.
- **Session Resumption / Page Refresh**: When a user reloads the browser mid-game, the active session correctly displays the question corresponding to `last_question_index` with sanitized contents for other questions intact.
- **Final Question Completion**: When the final question is answered, the session transitions cleanly to the victory/defeat result screen without attempting to fetch an out-of-bounds Question $N+1$.
- **Question Distribution & Deficit Borrowing**:
  - Target per match: Maximum 10 questions total (3 Easy, 3 Medium, 4 Hard).
  - When a difficulty tier lacks sufficient questions:
    1. If Hard < 4: Borrow remaining from Medium, then from Easy.
    2. If Medium < 3: Borrow remaining from Hard, then from Easy.
    3. If Easy < 3: Borrow remaining from Medium, then from Hard.
  - If total bank size $\ge 10$, match will always contain exactly 10 questions. If total bank size $< 10$, all available questions are used in ascending difficulty order.
  - Boss questions: The final question of each non-empty difficulty tier is flagged as a Boss Fight (`is_boss = True`), providing a boss battle at each stage.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST enforce a Single Source of Truth for the active question index between client UI and backend snapshot state.
- **FR-002**: The backend answer submission endpoint MUST respond idempotently if an answer for the specified question ID was already recorded in the session snapshot.
- **FR-003**: The client gameplay controller MUST maintain a synchronized lock (`isSubmittingRef` and `isAnswered`) to prevent concurrent answer submissions for the same question.
- **FR-004**: The client turn lifecycle MUST immediately freeze and disable timer execution, item activation, and option selection as soon as an answer has been submitted.
- **FR-005**: Advancing to the next question MUST update the active question index and state in memory without relying on stale cached data.
- **FR-006**: When question transitions occur, previous question contents in client state MUST be preserved without getting overwritten by sanitized blank entries.

### Key Entities

- **GameSessionSnapshot**: Represents the overall state of the arena game, including the ordered list of questions, answers recorded per question, and gamification state.
- **GamificationState**: Tracks lives, gold, points, current tier, boss HP, and `last_question_index` which determines the active question.
- **GameTurnState**: Client-side lifecycle state representing the active question index, selected option, correctness feedback, submission lock, and active buffs.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 0 occurrences of `"Question ID does not match current question index"` error toasts across standard gameplay, rapid clicking, and question transitions.
- **SC-002**: 100% of answer submissions and timeouts are idempotent and safe against race conditions.
- **SC-003**: Transition to the next question occurs immediately on user action without blank screens or missing question text.
- **SC-004**: All existing backend tests (`pytest`) and frontend type checks pass with 0 errors.

## Assumptions

- Users play in modern web browsers with standard JavaScript execution.
- Arena sessions follow a sequential question progression from index 0 to $M-1$.
- Anti-cheat timer verification remains active with a fair tolerance buffer for network latency.
