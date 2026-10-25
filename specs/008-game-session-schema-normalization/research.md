# Research & Technical Decisions: Game Session Schema Normalization

**Feature**: `008-game-session-schema-normalization`  
**Date**: 2026-10-25  
**Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/008-game-session-schema-normalization/spec.md)

---

## 1. Technical Decisions

### Decision 1: Replacing `tags_filter ARRAY(String)` with `lesson_slug VARCHAR(100) NOT NULL`
- **Context**: In historical sessions, 100% of rows (776/776) have exactly one tag in `tags_filter`, representing the lesson slug. Queries were forced to use array containment `.where(GameSession.tags_filter.contains([lesson_slug]))` which prevents simple B-Tree index lookups.
- **Decision**: Replace `tags_filter` with a first-class `lesson_slug VARCHAR(100) NOT NULL` column.
- **Rationale**:
  - Enables direct equality filters (`WHERE lesson_slug = :slug`).
  - Allows composite index `(user_id, lesson_slug, status)` for instant `get_active_by_lesson` checks.
  - Aligns API request model (`GamificationStartIn.lesson_slug`) directly with the database model.
- **Alternatives Considered**:
  - *Keep `tags_filter` alongside `lesson_slug`*: Rejected as redundant technical debt.
  - *Use GIN index on `tags_filter`*: Rejected because GIN indexes have high write overhead and array containment syntax is unnecessarily complex for a 1-to-1 relationship.

---

### Decision 2: Extracting Numeric Ranking Metrics to Native Columns
- **Context**: Currently, leaderboard queries perform on-the-fly string parsing and casting:
  ```python
  cast(GameSession.snapshot["gamification"]["final_score"].astext, Float).desc()
  cast(GameSession.snapshot["gamification"]["gold"].astext, Integer).desc()
  cast(GameSession.snapshot["gamification"]["total_time_response"].astext, Float).asc()
  cast(GameSession.snapshot["gamification"]["attempt_count"].astext, Integer).asc()
  ```
- **Decision**: Introduce explicit columns:
  - `final_score: Float NOT NULL DEFAULT 0.0`
  - `gold_earned: Integer NOT NULL DEFAULT 0`
  - `total_time_response: Float NOT NULL DEFAULT 0.0`
  - `attempt_count: Integer NOT NULL DEFAULT 1`
  - `current_tier: Integer NOT NULL DEFAULT 1`
  Add B-Tree indexes on `final_score` and `gold_earned`.
- **Rationale**:
  - Eliminates in-memory JSON parsing across thousands of rows.
  - Enables standard composite index for leaderboard: `(lesson_slug, status, question_limit, final_score DESC, gold_earned DESC, total_time_response ASC)`.
  - Simplifies repository queries into clean SQLAlchemy expressions.
- **Alternatives Considered**:
  - *Functional Index on JSON expressions*: `CREATE INDEX ON game_sessions ((cast(snapshot->'gamification'->>'final_score' as float)))`: Rejected because JSON documents remain bloated and fragile to key renaming.

---

### Decision 3: Storing `question_sequence` as a Dedicated `JSONB` Column
- **Context**: A game session consists of an ordered sequence of 10–15 question turns (`[{"id": "...", "tier": 1, "is_boss": false, "time_limit": 60}]`).
- **Decision**: Store the sequence in `question_sequence JSONB NOT NULL DEFAULT '[]'`.
- **Rationale**:
  - Question sequence is read only as a whole road-map when loading/hydrating the active session or reviewing.
  - It is never searched by element in cross-session queries (no need for a separate `game_session_questions` join table).
  - Keeps writes fast and atomic within `game_sessions`.
- **Alternatives Considered**:
  - *Normalize into a separate table `game_session_sequence`*: Over-engineering. Adds 15 rows per match and extra JOIN overhead with zero analytical benefit, since question-level analytics are already handled by `game_session_answers`.

---

### Decision 4: Replacing `snapshot` and `gamification` with `gamification_state JSONB`
- **Context**: Transient game loop state (`boss_hp`, `lives`, `points`, `shield_used_in_tier`, `current_question_started_at`) is needed during an active session, but does not belong in ranking queries.
- **Decision**: Replace the monolithic `snapshot` column with a targeted `gamification_state JSONB NOT NULL DEFAULT '{}'`.
- **Rationale**:
  - Completely eliminates the legacy `snapshot` blob.
  - Keeps transient gameplay state decoupled from persistent ranking columns.
  - Allows `GameSessionEntity` to map runtime state cleanly via `GamificationState.from_dict(...)` and `to_dict()`.

---

### Decision 5: Safe Zero-Downtime Alembic Migration Strategy
- **Migration Steps**:
  1. `ADD COLUMN` for `lesson_slug`, `final_score`, `gold_earned`, `total_time_response`, `attempt_count`, `current_tier`, `question_sequence`, `gamification_state` with sensible defaults.
  2. `UPDATE` backfill:
     - `lesson_slug = tags_filter[1]` (fallback to `snapshot->>'lesson_slug'`).
     - `final_score = COALESCE((snapshot->'gamification'->>'final_score')::float, 0.0)`.
     - `gold_earned = COALESCE((snapshot->'gamification'->>'gold')::int, 0)`.
     - `total_time_response = COALESCE((snapshot->'gamification'->>'total_time_response')::float, 0.0)`.
     - `attempt_count = COALESCE((snapshot->'gamification'->>'attempt_count')::int, 1)`.
     - `current_tier = COALESCE((snapshot->'gamification'->>'current_tier')::int, 1)`.
     - `question_sequence = COALESCE(snapshot->'question_sequence', '[]'::jsonb)`.
     - `gamification_state = COALESCE(snapshot->'gamification', '{}'::jsonb)`.
  3. `ALTER COLUMN lesson_slug SET NOT NULL`.
  4. `DROP COLUMN tags_filter`, `DROP COLUMN snapshot`.
  5. Create indexes:
     - `idx_game_sessions_lesson_slug`
     - `idx_game_sessions_user_lesson_status`
     - `idx_game_sessions_leaderboard`
- **Rationale**: Guarantees zero data loss across historical rows while enforcing strict relational constraints.
