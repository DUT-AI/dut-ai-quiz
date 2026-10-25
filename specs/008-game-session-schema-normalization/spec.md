# Feature Specification: Game Session Schema Normalization & Query Optimization

**Feature Branch**: `008-game-session-schema-normalization`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Thay thế tags_filter bằng lesson_slug VARCHAR(100) NOT NULL, Đưa final_score, gold_earned, total_time_response, attempt_count ra cột số thực tế có index. Giữ question_sequence là JSONB., bỏ luôn cột snapshot, thay thế gamification bằng cột gamification_state"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Instant Leaderboard & High-Performance Match Queries (Priority: P1)

As a competitive quiz player and platform user,
I want leaderboard rankings and lesson match history to load instantaneously without server latency,
So that I can immediately view my placement, rewards, and progress without sluggish database queries or timeouts.

**Why this priority**: Core user engagement and competition loop. Leaderboard queries currently perform on-the-fly JSON string parsing and casting (`cast(snapshot['gamification'][...].astext, Float)`) across thousands of rows, causing high database CPU and latency.

**Independent Test**: Can be tested by creating 100+ completed sessions for a lesson and executing `get_leaderboard_by_lesson`, verifying that the query executes an index scan on native numeric columns (`final_score`, `gold_earned`, `total_time_response`) in under 15ms.

**Acceptance Scenarios**:

1. **Given** multiple completed game sessions for lesson `yolo`,
   **When** a user or client requests the leaderboard for `yolo`,
   **Then** the database queries `game_sessions` filtered by `lesson_slug = 'yolo'` and sorted by native columns `final_score DESC, gold_earned DESC, total_time_response ASC` using B-Tree indexes with zero JSON casting.
2. **Given** a user starting or resuming a session,
   **When** the system checks for an active session,
   **Then** the query filters by `user_id = :uid AND lesson_slug = :slug AND status = 'IN_PROGRESS'` using a composite B-Tree index instead of PostgreSQL array containment (`tags_filter @> ARRAY[...]`).

---

### User Story 2 - Clean Architecture & Native Column Separation (Priority: P2)

As a backend engineer and system maintainer,
I want the `game_sessions` table to have explicit, strongly-typed columns for lesson identity, ranking metrics, and runtime state,
So that data integrity is guaranteed by the relational schema, eliminating redundant data (`tags_filter` vs `lesson_slug`) and the monolithic `snapshot` blob.

**Why this priority**: Maintainability, schema integrity, and database cleanliness. Eliminates technical debt where `lesson_slug` was stored in 3 places (`tags_filter`, `snapshot.lesson_slug`, API schema) and simplifies domain entity mappings.

**Independent Test**: Can be tested by starting, answering, and completing a session, verifying that updates modify explicit columns (`lesson_slug`, `final_score`, `gold_earned`, `total_time_response`, `question_sequence`, `gamification_state`) without touching or requiring any `snapshot` or `tags_filter` column.

**Acceptance Scenarios**:

1. **Given** a new game session creation request for lesson `yolo`,
   **When** `start_game_session` executes,
   **Then** the row is inserted with `lesson_slug = 'yolo'`, `question_sequence` stored directly as a JSONB array of question metadata, and initial scores set to 0 in native columns.
2. **Given** an active session receiving an answer,
   **When** `patch_game_answer` calculates updated rewards,
   **Then** `final_score`, `gold_earned`, and `total_time_response` are updated as native numeric fields, while runtime state (`boss_hp`, `lives`, `shield_used_in_tier`, `last_question_index`) is saved in `gamification_state`.
3. **Given** a finished game session,
   **When** inspected in the database,
   **Then** neither `snapshot` nor `tags_filter` exists, and all historical session values are cleanly represented in first-class columns.

---

### User Story 3 - Zero-Downtime Data Migration & Integrity Verification (Priority: P3)

As a database administrator,
I want all existing historical sessions across both `quizdb_dev` and `quizdb_prod` to be migrated to the new schema without data loss,
So that historical player scores, answers, and leaderboard standings remain 100% intact after the schema upgrade.

**Why this priority**: Data safety and backward consistency. 770+ historical sessions must be preserved accurately during the migration.

**Independent Test**: Can be tested by running the Alembic migration on a database with existing session rows and verifying that 100% of rows have non-null `lesson_slug`, correct numeric scores extracted from the legacy snapshot, and valid `question_sequence` and `gamification_state`.

**Acceptance Scenarios**:

1. **Given** existing sessions in `game_sessions` with `tags_filter` and `snapshot`,
   **When** the migration runs,
   **Then** `lesson_slug` is backfilled from `tags_filter[0]`, `final_score`, `gold_earned`, `total_time_response`, and `attempt_count` are backfilled from `snapshot.gamification`, and `question_sequence` is extracted directly.
2. **Given** completed migration,
   **When** validating the table schema,
   **Then** `tags_filter` and `snapshot` columns are dropped, and all new column indexes are active and valid.

---

### Edge Cases

- **Historical sessions with empty or null tags_filter**: Fallback to extracting `snapshot['lesson_slug']`, or default to `'unknown'`.
- **Historical sessions with missing gamification scores in JSON**: Default `final_score = 0.0`, `gold_earned = 0`, `total_time_response = 0.0`, `attempt_count = 1`, `current_tier = 1`.
- **Ties in leaderboard**: Sorted deterministically by `final_score DESC, gold_earned DESC, total_time_response ASC, attempt_count ASC, completed_at ASC`.
- **Client API contract preservation**: API responses (`GameSessionStartOut`, `GameSessionDetailOut`, `GameSessionReviewOut`) MUST retain their expected JSON contract fields so that the frontend (`apps/web`) experiences zero breaking changes.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST replace `tags_filter ARRAY(String)` with `lesson_slug VARCHAR(100) NOT NULL` in `game_sessions`.
- **FR-002**: System MUST create a B-Tree index `idx_game_sessions_lesson_slug` on `game_sessions(lesson_slug)` and a composite B-Tree index `idx_game_sessions_user_lesson_status` on `game_sessions(user_id, lesson_slug, status)`.
- **FR-003**: System MUST extract ranking metrics into native numeric columns:
  - `final_score FLOAT NOT NULL DEFAULT 0.0` (with index `idx_game_sessions_final_score`)
  - `gold_earned INTEGER NOT NULL DEFAULT 0` (with index `idx_game_sessions_gold_earned`)
  - `total_time_response FLOAT NOT NULL DEFAULT 0.0`
  - `attempt_count INTEGER NOT NULL DEFAULT 1`
  - `current_tier INTEGER NOT NULL DEFAULT 1`
- **FR-004**: System MUST store question metadata sequence directly in `question_sequence JSONB NOT NULL DEFAULT '[]'`.
- **FR-005**: System MUST store transient runtime gamification state in `gamification_state JSONB NOT NULL DEFAULT '{}'`.
- **FR-006**: System MUST drop the legacy `snapshot` and `tags_filter` columns from `game_sessions` in the database.
- **FR-007**: System MUST update all repository methods in `GameSessionRepository`:
  - `get_active_by_lesson` MUST query `WHERE user_id = :uid AND lesson_slug = :slug AND status = 'IN_PROGRESS'`
  - `count_completed_by_lesson` MUST query `WHERE user_id = :uid AND lesson_slug = :slug AND status = 'COMPLETED'`
  - `get_leaderboard_by_lesson` MUST order by native columns `final_score DESC, gold_earned DESC, total_time_response ASC, attempt_count ASC` with zero JSON text casting
  - `list_history` MUST query native columns directly
- **FR-008**: System MUST update `GameSessionEntity` in the domain layer and `GameSession` in the persistence layer to expose first-class attributes for `lesson_slug`, `final_score`, `gold_earned`, `total_time_response`, `attempt_count`, `current_tier`, `question_sequence`, and `gamification_state`.
- **FR-009**: System MUST provide an Alembic migration script that safely backfills data from existing columns before dropping `tags_filter` and `snapshot`.
- **FR-010**: System MUST maintain full compatibility with frontend presentation schemas (`GameSessionStartOut`, `GameSessionDetailOut`, `GameSessionReviewOut`), constructing response DTOs from the normalized entity attributes without breaking client expectations.

### Key Entities

- **`GameSession`**: Represents a user's gameplay run on a specific lesson.
  - `id`: UUID (Primary Key)
  - `user_id`: Integer (Foreign Key to users)
  - `lesson_slug`: String(100), non-null, indexed (Canonical identifier of the quiz lesson)
  - `status`: GameSessionStatus (IN_PROGRESS, COMPLETED, ABANDONED)
  - `started_at`: DateTime
  - `completed_at`: DateTime (nullable)
  - `question_limit`: Integer
  - `final_score`: Float, indexed
  - `gold_earned`: Integer, indexed
  - `total_time_response`: Float
  - `attempt_count`: Integer
  - `current_tier`: Integer
  - `question_sequence`: JSONB (List of `QuestionMeta`: id, tier, is_boss, time_limit)
  - `gamification_state`: JSONB (Runtime state: lives, boss_hp, points, shield_used_in_tier, current_question_started_at)
- **`GameSessionAnswer`**: Append-only log of answered question turns (created in 007, unchanged).

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Leaderboard queries (`get_leaderboard_by_lesson`) execute in under 15ms by utilizing native B-Tree index scan on `(lesson_slug, final_score, gold_earned)`.
- **SC-002**: Active session lookups (`get_active_by_lesson`) execute in under 5ms using index on `(user_id, lesson_slug, status)`.
- **SC-003**: Zero references to `tags_filter` or `snapshot` column remain in `game_sessions` table or backend code.
- **SC-004**: 100% of historical sessions across both `quizdb_dev` and `quizdb_prod` are migrated with matching final scores, gold, and lesson slugs.
- **SC-005**: All existing unit and integration test suites pass (100% pass rate).

---

## Assumptions

- Each game session belongs to exactly one lesson slug (confirmed by 100% of historical data having exactly 1 tag).
- The append-only table `game_session_answers` remains the single source of truth for individual question answer records.
- Frontend consumes session details through existing hydrated endpoints (`/sessions/{id}`, `/sessions/active`, `/sessions/{id}/review`), which remain contractually backward-compatible.
