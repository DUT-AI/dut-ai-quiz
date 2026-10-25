# Research & Technical Decisions: Game Session Storage Refactor

**Branch**: `007-game-session-storage-refactor` | **Date**: 2026-10-25 | **Feature**: [spec.md](./spec.md)

This document consolidates architectural investigations, technology choices, and concrete technical solutions for replacing the legacy JSONB snapshot state with an append-only answer log and normalized session state.

---

## 1. Persistence & Concurrency Strategy

### Decision
Implement an append-only table `game_session_answers` with a composite unique constraint `UNIQUE(session_id, question_id)` and row-level locking (`SELECT ... FOR UPDATE`) during answer processing.

### Rationale
- **Zero Lost Updates**: In competitive quiz sessions, client timers often trigger auto-submit at the exact moment a player clicks an option. Without database-level isolation, two concurrent HTTP requests read identical state, calculate rewards in parallel, and overwrite each other. A database unique constraint ensures that only one request can ever write an answer record for `(session_id, question_id)`. The secondary request fails immediately with an integrity violation or conflict response, guaranteeing idempotency.
- **Write Amplification Reduction**: A game session has 10–20 questions. Serializing 20 questions (each containing markdown content, formula equations, and 4 options) repeatedly on every question submission writes 30KB–100KB per turn. Across 10 turns, that is ~1MB of redundant JSON I/O per player. Under the append-only model:
  - Answer insertion writes ~200 bytes into `game_session_answers`.
  - Session counter update modifies only lightweight numerical counters (`lives`, `gold`, `points`, `last_question_index`).
  - Total DB I/O drops by >90%.

### Alternatives Considered
- **Optimistic Locking (`version` column on `game_sessions`)**: Rejected as standalone solution because it requires application-level retries. Retrying an answer submission is dangerous because it could re-apply time penalties or double-score items. An append-only ledger with unique constraint handles conflict at the database layer without retry risks.
- **Redis In-Memory State**: Rejected because quiz sessions require immediate persistence for educational compliance and streak continuity. PostgreSQL easily sustains required throughput when not burdened by giant JSON writes.

---

## 2. Question Reference vs Versioning Strategy

### Decision
Live Catalog Reference: Game sessions store only an ordered sequence of question UUIDs and turn configuration (`tier`, `is_boss`, `time_limit`). Static content (markdown text, code blocks, option text) is loaded on-demand from `IQuestionRepository`.

### Rationale
- Questions in `dut-ai-quiz` are educational practice content. Fixes to typographical errors or clarification to option text should immediately benefit players in active sessions.
- Sessions remain extremely compact: `question_sequence` is an array of UUIDs and integers.
- Eliminates duplicate source of truth between the `questions` table and `game_sessions` table.

### Alternatives Considered
- **Embedded Snapshot (Status Quo)**: Rejected due to write amplification, data desynchronization, and the security hazard of having future questions present in the session snapshot.
- **Immutable Question Versioning**: Deferred as out-of-scope for practice quiz modes; adds unnecessary schema complexity (version tracking tables) without immediate user value.

---

## 3. Security by Architecture (Deprecating `sanitize_game_snapshot`)

### Decision
Completely eliminate `sanitize_game_snapshot` and all `copy.deepcopy` calls. The backend will *never* load or serialize future questions into memory or API payloads.

### Rationale
- In the legacy codebase, `start_game`, `get_active_game`, `get_game`, and `finish_game` loaded all 10–20 questions into the snapshot, requiring an ad-hoc sanitization function that looped through and blanked out `content = ""` and `options = []` for future questions to prevent client inspection.
- Under the new architecture, turn progression only fetches the *current* active question (and the immediate *next* question when transitioning). The API payload physically cannot leak future questions because the server has not retrieved them.
- Deletes ~40 lines of repetitive, fragile code and removes multiple inline `import copy` calls.

---

## 4. Historical Data Migration & Clean Architecture

### Decision
Execute a two-stage Alembic migration:
1. **Schema Migration**: Create table `game_session_answers` with foreign keys, indexes, and unique constraint. Add `current_question_index` and normalized gamification fields or clean lightweight metadata column.
2. **Data Backfill**: A dedicated data migration function iterates over completed `game_sessions` having legacy `snapshot` data, extracts `snapshot.answers`, resolves the corresponding `time_response` and correctness, and bulk-inserts rows into `game_session_answers`. Once verified, legacy snapshots are converted to the clean format.
3. **Zero Backward-Compatibility Shims**: Per user directive, remove all deprecated aliases (`GamificationStateOut`, `GamificationAnswerResultOut`, `GameQuestionSnapshotOut` compatibility re-exports) and legacy fallback routines. The codebase will speak only the new, clean domain language.

---

## 5. Explicit API Contracts & Frontend Synergy

### Decision
Define explicit Pydantic DTOs with `response_model` on every router endpoint, eliminating untyped dictionaries:
- `POST /api/v1/game/sessions` -> `response_model=GameSessionStartOut`
- `GET /api/v1/game/sessions/active` -> `response_model=GameSessionActiveOut`
- `PATCH /api/v1/game/sessions/{id}/answers` -> `response_model=GamificationAnswerResultOut`
- `GET /api/v1/game/sessions/{id}/review` -> `response_model=GameSessionReviewOut`

### Rationale
- Satisfies **Constitution Principle II (Single Source of Truth API Contracts)**.
- Running `make generate-api` produces exact TypeScript types in `apps/web/types/api.generated.d.ts`.
- Simplifies frontend `use-game-turn.ts`: deletes the 20-line fallback loop that attempted to re-stitch sanitized empty question objects.
