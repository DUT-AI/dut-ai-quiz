# Feature Specification: Clean Game Session API Contract & Dead Code Elimination

**Feature Branch**: `009-clean-game-contract-dead-code`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Xóa hết dead code và thay đổi API contract giữa BE và FE để phù hợp hơn (không cần giữ backward compatibility cho contract cũ, ưu tiên làm sạch BE trước rồi cập nhật FE)"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Streamlined Game Session Initialization and Resumption (Priority: P1)

As a quiz player,
I want my quiz session to start and resume cleanly with only the exact current active question and current game state,
So that gameplay loads instantly with zero unnecessary overhead or duplicate data structures.

**Why this priority**: Core user interaction loop. The current session payload wraps state inside a redundant legacy `snapshot` container, returns obsolete array filters (`tags_filter`), and duplicates question metadata across multiple levels. Streamlining this contract makes session bootstrap lightweight, predictable, and robust.

**Independent Test**: Can be tested by starting a new session via `POST /game/sessions` or resuming an active session via `GET /game/sessions/active?lesson_slug={slug}`, verifying that the response delivers the unified session entity with top-level game metrics and the active question directly without any `snapshot` nesting.

**Acceptance Scenarios**:

1. **Given** an authenticated user requesting to start a quiz for lesson `math-101`,
   **When** `POST /game/sessions` is called,
   **Then** the response returns top-level session attributes (`id`, `user_id`, `lesson_slug`, `status`, `started_at`, `question_limit`, `current_question_index`), the active `current_question` (hydrated with content and options), and the current `gamification` state without any nested `snapshot` wrapper.
2. **Given** a user returning to an incomplete session for `math-101`,
   **When** `GET /game/sessions/active?lesson_slug=math-101` is called,
   **Then** the system returns the identical clean session model, allowing the client to resume gameplay seamlessly.
3. **Given** a finished or abandoned session,
   **When** `POST /game/sessions/{id}/finish` is called,
   **Then** the response returns the finalized session record with `completed_at`, `status = "COMPLETED"`, final score, coins earned, and total response time as first-class attributes.

---

### User Story 2 - Lean & High-Precision Turn Evaluation (Priority: P2)

As a quiz player,
I want instant feedback upon submitting an answer with only the outcome of that turn and the next question,
So that gameplay is snappy, smooth, and free of redundant network payload bloat.

**Why this priority**: High-frequency real-time gameplay interaction. In every turn, the client submits an answer and receives feedback. Previously, the backend echoed a full redundant `snapshot` clone inside `GamificationAnswerResultOut` that the client never used. Removing this bloat reduces payload weight and latency on mobile/slow connections.

**Independent Test**: Can be tested by submitting an answer to an active question via `PATCH /game/sessions/{id}/answers`, verifying that the response contains only turn resolution fields (`is_correct`, `points_gained`, `coins_gained`, `updated_gamification`, `is_game_over`, `correct_option_id`, and `next_question`), with no unused snapshot objects.

**Acceptance Scenarios**:

1. **Given** an active question turn,
   **When** the user submits their selected option via `PATCH /game/sessions/{id}/answers`,
   **Then** the response provides immediate correctness feedback, updated player gamification stats (lives, gold, score), and the hydrated `next_question` if more questions remain.
2. **Given** an answer submission that drains all lives or answers the final question,
   **When** the turn evaluates,
   **Then** `is_game_over` is returned as `true`, `next_question` is `null`, and the session status transitions to completed without redundant payload attachments.
3. **Given** a duplicate answer submission for a turn that has already been recorded,
   **When** the request arrives,
   **Then** the system rejects the duplicate submission with a `409 Conflict` domain error, preserving turn idempotency.

---

### User Story 3 - Transparent Match History & Clean Domain Architecture (Priority: P3)

As a student reviewing learning progress and as a maintainer auditing the codebase,
I want match history endpoints and internal domain entities to be completely purged of transitional compatibility shims and dead code,
So that code maintainability is maximized and match history renders directly from native indexed metrics.

**Why this priority**: Eliminates technical debt and prevents confusion across frontend and backend engineering. The codebase currently retains backward-compatibility properties (`session.tags_filter`, `session.snapshot`), standalone module functions, and unused schema fields.

**Independent Test**: Can be tested by requesting `GET /game/history`, verifying that every history item returns clean top-level performance figures (`final_score`, `gold_earned`, `total_time_response`, `completed_at`, `status`) in under 20ms without invoking secondary hydration or computing fake compatibility dictionaries.

**Acceptance Scenarios**:

1. **Given** a user requesting past game sessions,
   **When** `GET /game/history` is queried,
   **Then** the list of session detail records is returned with direct lesson identifiers and performance metrics, containing zero references to `tags_filter` or nested `snapshot` containers.
2. **Given** the backend codebase,
   **When** scanned for transitional shims,
   **Then** all legacy properties (`@property def tags_filter`, `@property def snapshot` in `GameSessionEntity`), standalone helpers in `game_hydration.py`, and deprecated schema fields are completely absent.

---

### Edge Cases

- **Session Resume Non-Existent**: When `GET /game/sessions/active` is called for a lesson with no active session, the system returns `404 Not Found` with a clear, concise detail message.
- **Finished Session Double-Finish**: Calling `POST /game/sessions/{session_id}/finish` on an already completed session is idempotent and returns the existing completed session state without mutating timestamps.
- **Turn After Game Over**: Submitting an answer after a session is marked `COMPLETED` or game-over returns `400 Bad Request` or `409 Conflict`.
- **Boss Encounter Questions**: Active or next questions flagged as boss questions retain `is_boss: true` and appropriate tier metadata without requiring any extra payload container.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST provide a single, unified game session representation (`GameSessionOut`) containing top-level fields: `id` (UUID), `user_id` (int), `lesson_slug` (string), `status` (string), `started_at` (datetime), `completed_at` (datetime or null), `question_limit` (int), `current_question_index` (int), `current_question` (optional hydrated question object), and `gamification` (`GamificationStateOut`).
- **FR-002**: The system MUST eliminate the nested `snapshot` container object (`GameSessionSnapshotOut`) from all session creation (`POST /sessions`), session resume (`GET /sessions/active`), session detail (`GET /sessions/{id}`), and finish (`POST /sessions/{id}/finish`) endpoints.
- **FR-003**: The system MUST eliminate the redundant `snapshot` field from `GamificationAnswerResultOut`.
- **FR-004**: The system MUST eliminate the deprecated `tags_filter` field from all API schemas and domain models, standardizing exclusively on `lesson_slug`.
- **FR-005**: The system MUST delete all backward-compatibility standalone functions in `game_hydration.py` (`hydrate_question_snapshot`, `hydrate_session_start_out`) and enforce reliance solely on `GameHydrationService`.
- **FR-006**: The system MUST remove transitional properties (`tags_filter`, `snapshot`) from `GameSessionEntity` and domain interfaces.
- **FR-007**: The system MUST synchronize the updated OpenAPI schema to the frontend via `make generate-api` and update frontend game features (`apps/web/features/game/`) to consume the clean schema directly.
- **FR-008**: The system MUST ensure all existing and updated backend tests (`apps/api/test/`) and frontend quality checks (`npm run lint`, `npm run type-check`) pass without warnings or errors.

### Key Entities *(include if feature involves data)*

- **GameSession**: The primary aggregate representing a user's gameplay run on a specific lesson.
  - Core attributes: `id` (UUID), `user_id` (int), `lesson_slug` (string), `status` (enum: `IN_PROGRESS`, `COMPLETED`), `started_at` (datetime), `completed_at` (datetime | None), `question_limit` (int), `current_question_index` (int), `gamification` (GamificationState).
- **GameQuestion**: The presentation representation of an active question for the client.
  - Core attributes: `id` (string), `content` (string), `options` (list of `{id, text}`), `time_limit` (int), `tier` (int), `is_boss` (bool).
- **GameTurnResult**: The response returned when an answer is evaluated.
  - Core attributes: `is_correct` (bool), `points_gained` (int), `coins_gained` (int), `updated_gamification` (GamificationState), `is_game_over` (bool), `correct_option_id` (string | None), `next_question` (GameQuestion | None).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: API response payload size for game session initialization and turn answers is reduced by at least 40% through the elimination of duplicate snapshot containers.
- **SC-002**: 100% of transitional compatibility shims (`tags_filter`, fake `.snapshot` properties, standalone legacy functions) are permanently removed from the codebase.
- **SC-003**: Both backend (`apps/api`) and frontend (`apps/web`) compile and run against a single canonical contract generated directly from FastAPI's OpenAPI specification.
- **SC-004**: 100% test pass rate across the full automated test suite (`uv run pytest`) and pre-commit checks (`make check`).

## Assumptions

- We are intentionally breaking legacy API contracts without a multi-phase deprecation window, as explicitly instructed by the project lead ("Tôi thì cũng không muốn phải giữ API contract giữa BE và FE => Phát triển BE trước rồi cho clean rồi chỉnh sửa lại FE").
- The database schema normalization (migration `f01a2b3c4d5e`) has already introduced native columns (`lesson_slug`, `final_score`, `gold_earned`, `total_time_response`, `question_sequence`, `gamification_state`), making the persistence layer fully ready for this clean contract.
- Frontend adjustments will occur immediately following the backend contract changes, utilizing automated TypeScript code generation (`make generate-api`).
