# Implementation Plan: Game Session Schema Normalization & Query Optimization

**Branch**: `008-game-session-schema-normalization` | **Date**: 2026-10-25 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/008-game-session-schema-normalization/spec.md)

**Input**: Feature specification from `/specs/008-game-session-schema-normalization/spec.md`

## Summary

Normalize `game_sessions` table by:
1. Replacing the redundant `tags_filter ARRAY(String)` with an indexed `lesson_slug VARCHAR(100) NOT NULL` column.
2. Promoting key ranking and scoring metrics (`final_score`, `gold_earned`, `total_time_response`, `attempt_count`, `current_tier`) from JSON into first-class numeric columns with B-Tree indexes.
3. Decoupling the legacy `snapshot` blob into:
   - `question_sequence JSONB NOT NULL DEFAULT '[]'` (stores ordered question metadata roadmap).
   - `gamification_state JSONB NOT NULL DEFAULT '{}'` (stores transient in-game state: lives, boss HP, shield).
4. Dropping `tags_filter` and `snapshot` columns completely.
5. Updating all queries in `GameSessionRepository` and domain mappings in `GameSessionEntity` to execute fast Index Scans without in-memory JSON casting.

---

## Technical Context

**Language/Version**: Python 3.12 (Backend), TypeScript 5.x (Frontend)  
**Primary Dependencies**: FastAPI, SQLAlchemy 2.0 (asyncpg), Alembic, Dishka, Pydantic v2  
**Storage**: PostgreSQL (pgvector available, B-Tree indexes on normalized columns)  
**Testing**: Pytest (`pytest-asyncio`), `make check` (Ruff, ESLint, TypeScript tsc)  
**Target Platform**: Linux / macOS server (Docker containerized)  
**Project Type**: Monorepo Web Application (`apps/api` + `apps/web`)  
**Performance Goals**: Leaderboard query latency < 15ms; active session lookup < 5ms  
**Constraints**: Zero data loss across historical sessions; 100% backward compatibility for API schemas  
**Scale/Scope**: ~1,000 existing sessions, scalable to 100,000+ sessions without query degradation  

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I (Lightweight DDD)**: Changes are strictly partitioned across layers:
  - `presentation/`: DTO mapping preserves API contracts.
  - `domain/entities/`: `GameSessionEntity` exposes first-class typed attributes.
  - `infrastructure/persistence/`: `GameSession` SQLModel maps to normalized columns.
  - `infrastructure/repositories/`: `GameSessionRepository` queries native indexed columns.
- [x] **Principle II (Single Source of Truth API Contracts)**: Public API responses (`GameSessionStartOut`, `GameSessionDetailOut`, `GameSessionReviewOut`) preserve their external contract structure.
- [x] **Principle III (Feature-First Frontend)**: Frontend consumes existing API shapes with zero breaking changes.
- [x] **Principle IV (Test-Driven Verification)**: Automated tests (`apps/api/test/test_game_*.py`) and `make check` verify correctness at each stage.
- [x] **Principle V (Authority & State Separation)**: Server maintains strict authority over session scores and progression; client displays hydrated turns.

---

## Project Structure

### Documentation (this feature)

```text
specs/008-game-session-schema-normalization/
├── plan.md              # Master Implementation Plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Table schema, indexes, entity and repository mapping
├── contracts/           # API contract definitions (backward-compatible)
│   └── game-session.md
├── quickstart.md        # Runnable verification guide and validation queries
└── checklists/
    └── requirements.md  # Spec quality validation checklist
```

### Source Code Impact Layout

```text
apps/api/
├── alembic/versions/
│   └── f01a2b3c4d5e_normalize_game_sessions_schema.py    # Database migration & backfill
├── app/
│   ├── domain/
│   │   └── entities/
│   │       └── game.py                                   # GameSessionEntity normalized attributes
│   ├── infrastructure/
│   │   ├── persistence/models/
│   │   │   └── game.py                                   # GameSession SQLModel with new columns
│   │   └── repositories/
│   │       └── game_sessions.py                          # Query optimizations (remove astext casting)
│   ├── application/
│   │   └── use_cases/game/
│   │       ├── start_game_session.py                     # Writes lesson_slug and question_sequence
│   │       ├── patch_game_answer.py                      # Updates native score columns and gamification_state
│   │       ├── finish_game_session.py                    # Finalizes native final_score and status
│   │       └── get_game_history_summary.py               # Reads lesson_slug directly
│   └── presentation/
│       └── api/routers/game.py                           # DTO mapping backward compatibility
└── test/
    ├── test_game_unit.py                                 # Unit tests updated with lesson_slug
    ├── test_game_review.py                               # Review tests
    ├── test_game_concurrency.py                          # Concurrency tests
    └── test_game_storage_refactor.py                     # Storage normalization tests
```

---

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
| :--- | :--- | :--- |
| None | All principles in Constitution are fully upheld | N/A |
