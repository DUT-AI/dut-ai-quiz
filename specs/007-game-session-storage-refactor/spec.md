# Feature Specification: Game Session Storage Refactoring & Append-Only Answer Logging

**Feature Branch**: `007-game-session-storage-refactor`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Dùng JSON Snapshot khổng lồ lưu toàn bộ State vào CSDL (PostgreSQL). Hiện trạng: Toàn bộ session được nhét vào 1 trường JSON snapshot. Mỗi khi user trả lời một câu, hệ thống đọc cả cục JSON ra, cập nhật, rồi ghi đè nguyên cục JSON đó xuống DB. Hậu quả: Tốn I/O và băng thông DB, dễ xung đột dữ liệu (Lost Updates). Giải pháp chuẩn kĩ sư: Không nhét nội dung tĩnh của câu hỏi vào snapshot (chỉ lưu question_ids). Tách bảng game_session_answers (quan hệ 1-N) để ghi nhận từng lượt trả lời (Append-only log), vừa dễ audit, thống kê analytics, vừa tránh lock/ghi đè JSON."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Seamless Quiz Play with Instant Answer Recording (Priority: P1)

As a quiz participant,
I want each of my answers to be recorded individually and immutably the moment I submit it,
So that my score, streak, and rewards are accurately preserved with zero delay or risk of state loss.

**Why this priority**: Core game loop. Every participant's action hinges on reliable, low-latency answer processing and instant progression to the next question.

**Independent Test**: Can be tested by starting a game session, answering questions sequentially, verifying that each answer creates a persistent audit entry, and receiving the next question with updated gamification stats.

**Acceptance Scenarios**:

1. **Given** an active game session at question index 0,
   **When** the participant selects an option and submits the answer within the allowed time limit,
   **Then** the answer record is appended with response time and outcome, participant rewards (points/gold/lives) are updated, and the hydrated next question is returned.
2. **Given** the participant is on the final question of a session,
   **When** they submit their answer and still have remaining lives,
   **Then** the final answer is logged, the session is marked as completed with a finalized score, and the victory summary is returned.

---

### User Story 2 - Anti-Concurrency & Lost-Update Protection (Priority: P2)

As a competitive player,
I want the system to guard against race conditions between timer expiration and manual submissions,
So that my valid answers are never silently overwritten or duplicated if a timeout and a click occur at the same millisecond.

**Why this priority**: Integrity and fairness. Race conditions between client timer triggers and user action cause lost updates or duplicate score deduction, breaking trust in competition.

**Independent Test**: Can be tested by firing two concurrent answer submission requests with identical session and question identifiers, verifying that exactly one request succeeds and the duplicate is safely rejected with idempotency enforcement.

**Acceptance Scenarios**:

1. **Given** an active question turn,
   **When** two submission requests for the same question arrive simultaneously (e.g. timeout auto-submit and participant click),
   **Then** the system commits exactly one answer record, processes the outcome once, and safely rejects or ignores the second submission without data corruption.
2. **Given** a question that has already been answered,
   **When** any subsequent answer attempt is made for that same question,
   **Then** the system rejects the attempt with an unambiguous error indicating the turn has already concluded.

---

### User Story 3 - Granular Match Review & Educational Analytics (Priority: P3)

As a learner and instructor,
I want to view a detailed breakdown of each answered question (time taken, chosen option, correctness),
So that I can analyze performance, identify weak knowledge areas, and verify game session legitimacy.

**Why this priority**: Value-add educational analytics. Storing individual answer logs enables post-match review screens, question difficulty analytics, and cheat detection.

**Independent Test**: Can be tested by loading the review endpoint of a completed session and verifying that every answered question returns its full historical attempt timeline.

**Acceptance Scenarios**:

1. **Given** a finished game session,
   **When** the user or educator requests the session review,
   **Then** the system provides an ordered chronological log of every answered question with participant choices, response durations, and score deltas.

---

### Edge Cases

- **Double-Click / Rapid Retries**: What happens when a user clicks an option multiple times rapidly? The system must enforce a unique constraint per `(session, question)` pair so only the first request writes the answer.
- **Client Disconnection During Turn**: What happens if the player closes the browser midway? The session remains in progress; upon reconnecting, the system loads the current pending question based on the question sequence minus already recorded answers.
- **Question Bank Updates Mid-Game**: What happens if an admin edits a question's text while a session is active? Because sessions reference question identifiers, the user sees the latest content when hydrating the turn, or alternatively the snapshot pins question versioning [NEEDS CLARIFICATION: see Question 1].
- **Legacy Session Compatibility**: How are active or finished sessions created before this refactoring handled? [NEEDS CLARIFICATION: see Question 2].

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST decouple static question content (text, options, markdown) from the session persistence model, storing only question references and turn sequencing in the session record.
- **FR-002**: System MUST persist every answer submission as an independent, append-only record linked to the session and question.
- **FR-003**: System MUST enforce idempotency on answer submissions, ensuring that no question within a session can be answered more than once.
- **FR-004**: System MUST hydrate only the current active question (and next question on submission) from the question catalog when serving game turns, preventing cheat-prone leakage of future questions.
- **FR-005**: System MUST maintain the active participant gamification state (lives, gold, score, streak, current stage/boss status) alongside the session without duplicating question body text.
- **FR-006**: System MUST compute final session statistics (total correct, total time, accuracy) from the aggregated answer log upon session completion.
- **FR-007**: System MUST support transactional integrity such that answer logging and gamification state progression succeed or fail atomically.

### Key Entities *(include if feature involves data)*

- **Game Session**: The lifecycle container for a quiz run. Tracks participant ID, start/end timestamps, session status (IN_PROGRESS, COMPLETED), question sequence metadata (ordered list of question IDs, difficulty tiers, boss flags), and current gamification state.
- **Game Session Answer (Append-Only Log)**: Individual log entry for each answered question. Contains reference to session, reference to question, selected option, correctness flag, response time in seconds, points gained, coins gained, and timestamp.
- **Question Catalog**: Master repository of questions and options, referenced by identifier rather than copied into session state.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Eliminate 100% of lost-update conflicts caused by concurrent answer submissions through database-level uniqueness constraints.
- **SC-002**: Reduce database I/O write volume per answer turn by over 90% (from serializing a 20-question JSON snapshot down to a lightweight single-row insert and counter update).
- **SC-003**: Maintain end-to-end turn answer submission latency under 150ms under typical load.
- **SC-004**: Achieve 100% data auditability for completed games, allowing step-by-step reconstruction of any game session from its answer logs.

## Assumptions

- Question identifiers (UUIDs) are unique and stable across the question catalog.
- The maximum number of questions per game session remains bounded (typically 10 to 20 questions).
- The client application receives turn responses with the next question pre-hydrated, preserving existing frontend responsiveness without requiring additional round-trips.

## Clarification Decisions *(Resolved)*

### Decision 1: Live Catalog Reference by Question ID
- **Choice**: Option A (Live Catalog Reference).
- **Details**: Game sessions store only `question_id` (UUID) and sequence metadata (`tier`, `is_boss`, `time_limit`). Static content (markdown text, options) is hydrated live from the question catalog on turn retrieval.
- **Rule**: No static question or option text is ever serialized into `game_sessions`.

### Decision 2: Historical Legacy Data Migration & Clean Architecture
- **Choice**: Option B with Zero Backward-Compatibility Shims.
- **Details**: An Alembic data migration script parses historical completed sessions, extracts answered questions, and backfills rows into `game_session_answers`.
- **Rule**: All legacy backward-compatible shims (such as `sanitize_game_snapshot`, `copy.copy`, dual-read fallbacks, and legacy DTO aliases) MUST be removed completely. The codebase will speak only the new, clean domain language.

