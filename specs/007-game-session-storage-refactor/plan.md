# Implementation Plan: Game Session Storage Refactor & Append-Only Answer Log

**Branch**: `007-game-session-storage-refactor` | **Date**: 2026-10-25 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/007-game-session-storage-refactor/spec.md` with explicit architectural decisions:
- Question content referenced live from question catalog by `question_id`.
- Append-only answer log table `game_session_answers` with `UNIQUE(session_id, question_id)`.
- Full backfill Alembic migration script for legacy historical sessions.
- Zero backward-compatibility shims: eliminate `sanitize_game_snapshot`, `copy.copy`, and deprecated aliases.

---

## Summary

This refactoring replaces the legacy JSONB snapshot state in `game_sessions` with a normalized, append-only answer ledger (`game_session_answers`) and lightweight question sequence metadata. It solves write amplification (>90% I/O reduction), eliminates concurrency race conditions (lost updates) between user clicks and auto-timeout submissions, and deprecates the fragile `sanitize_game_snapshot` filtering mechanism by hydrating only the active question on demand.

---

## Technical Context

**Language/Version**: Python 3.11+ (Backend `apps/api`), TypeScript 5+ (Frontend `apps/web`).

**Primary Dependencies**: FastAPI, SQLModel / SQLAlchemy, Alembic, Dishka (DI), TanStack Query v5, openapi-typescript.

**Storage**: PostgreSQL with JSONB and relational foreign keys.

**Testing**: Pytest (`uv run pytest`) for backend; TypeScript compiler (`npm run type-check`) and Jest/Playwright for frontend.

**Target Platform**: Linux/Docker server (API port 8000), Next.js 14 App Router (Web port 3000).

**Project Type**: Monorepo Web Service + Web Application.

**Performance Goals**: Turn submission round-trip <100ms; DB write payload per turn <500 bytes (reduced from ~100KB); 0% lost updates.

**Constraints**: Strict adherence to [DUT-AI Quiz Constitution v1.0.0](../../.specify/memory/constitution.md); zero backward-compatibility shims.

**Scale/Scope**: ~10–20 questions per quiz session; hundreds of concurrent quiz sessions without lock degradation.

---

## Constitution Check

*GATE: All principles from DUT-AI Quiz Constitution v1.0.0 verified.*

| Principle | Status | Evaluation |
|-----------|:------:|------------|
| **I. Lightweight DDD** | **PASS** | Strict separation: `presentation/` (FastAPI routers with Pydantic DTOs), `application/use_cases/` (granular turn interactors), `domain/` (`GameSessionEntity`, `GameSessionAnswerEntity`), `infrastructure/` (SQLModel repositories & Alembic). |
| **II. Single Source of Truth API Contracts** | **PASS** | Explicit Pydantic schemas with `response_model` on every endpoint. No untyped dictionaries. Frontend types synced via `make generate-api`. |
| **III. Feature-First Frontend Architecture** | **PASS** | Domain types mapped directly in `apps/web/features/game/types.ts`. Obsolete fallback loop in `use-game-turn.ts` removed. |
| **IV. Test-Driven Verification & Quality Gates** | **PASS** | Dedicated Pytest suite (`test/test_game_session_storage.py`) covering turn progression, idempotency, race conditions, and migration backfill. |
| **V. Authority & State Separation** | **PASS** | Server retains absolute authority over question correctness, turn outcome, and anti-cheat validation. No client-side timer drift anti-patterns. |

---

## Project Structure

### Documentation (this feature)

```text
specs/007-game-session-storage-refactor/
├── spec.md              # Feature specification with ratified decisions
├── plan.md              # Implementation plan (this file)
├── research.md          # Phase 0: Architectural investigation & decisions
├── data-model.md        # Phase 1: Database DDL, entities & state invariants
├── quickstart.md        # Phase 1: Verification guide & test commands
├── contracts/           # Phase 1: OpenAPI 3.1 contract specification
│   └── game-api.yaml
└── checklists/
    └── requirements.md  # Quality verification checklist
```

### Source Code Impacted

```text
apps/api/
├── alembic/versions/                                    # New Alembic migration (table + backfill)
├── app/
│   ├── domain/
│   │   ├── entities/
│   │   │   ├── game.py                                  # Refactored GameSessionEntity
│   │   │   └── game_answer.py                           # NEW: GameSessionAnswerEntity
│   │   ├── interfaces/repositories.py                   # IGameSessionAnswerRepository
│   │   └── value_objects/gamification.py                # Streamlined GamificationState & QuestionMeta
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── models/
│   │       │   ├── game.py                              # Updated GameSession SQLModel
│   │       │   └── game_answer.py                       # NEW: GameSessionAnswer SQLModel
│   │       └── repositories/
│   │           ├── game.py                              # Updated GameSessionRepository
│   │           └── game_answer.py                       # NEW: GameSessionAnswerRepository
│   ├── application/use_cases/game/
│   │   ├── start_game_session.py                        # Stores question_sequence; hydrates Q0
│   │   ├── patch_game_answer.py                         # Inserts to game_session_answers; hydrates Q_next
│   │   ├── get_active_game_session.py                   # Hydrates Q_current on demand
│   │   ├── get_game_session.py                          # Hydrates Q_current on demand
│   │   ├── get_game_session_review.py                   # NEW: Review timeline use case
│   │   ├── use_item_game.py                             # Atomic item usage
│   │   └── finish_game_session.py                       # Aggregates results from answers table
│   └── presentation/
│       ├── schemas/game.py                              # Pydantic DTOs with response_model
│       └── api/routers/game.py                          # Clean router, NO sanitize_game_snapshot
apps/web/
├── types/api.generated.d.ts                             # Auto-generated via make generate-api
├── features/game/
│   ├── types.ts                                         # Direct mapping of clean schemas
│   ├── queries.ts                                       # Query hooks for start, turn, and review
│   └── hooks/
│       ├── use-game-turn.ts                             # Streamlined turn activation (no fallback loop)
│       └── use-game-session.ts                          # Reads hydrated session start DTO
```

---

## Implementation Execution Phases

### Phase 2: Database Migration & Persistence Models
1. Create `apps/api/app/infrastructure/persistence/models/game_answer.py` mapping `game_session_answers` with `UniqueConstraint("session_id", "question_id")`.
2. Refactor `GameSession` model in `models/game.py`: update `to_entity` and `from_entity`.
3. Create Alembic migration script:
   - DDL for `game_session_answers` with indexes and foreign keys.
   - Data migration routine parsing legacy JSON `snapshot` and backfilling answer rows.
4. Implement `GameSessionAnswerRepository` in `repositories/game_answer.py` and register in Dishka container (`ioc.py`).

### Phase 3: Domain & Application Use Cases
1. Create `GameSessionAnswerEntity` in `app/domain/entities/game_answer.py`.
2. Update `GameSessionEntity` and `gamification.py`: replace giant question dictionaries with `QuestionMeta`.
3. Refactor `start_game_session.py`: store only `question_sequence` metadata; hydrate Q0 from `IQuestionRepository`.
4. Refactor `patch_game_answer.py`:
   - Enforce row lock or unique constraint check on `game_session_answers`.
   - Append answer row; atomically update gamification state.
   - Hydrate next question from `IQuestionRepository`.
5. Implement `GetGameSessionReviewUseCase` (`get_game_session_review.py`) returning chronological review items.
6. Refactor `finish_game_session.py`: aggregate `final_score` and `correct_count` from `game_session_answers`.

### Phase 4: Presentation & Router Cleansing
1. Update `apps/api/app/presentation/schemas/game.py`: define explicit schemas (`GameSessionStartOut`, `GameSessionReviewOut`, etc.).
2. Refactor `apps/api/app/presentation/api/routers/game.py`:
   - Delete `sanitize_game_snapshot` and all `import copy` calls.
   - Attach explicit `response_model` to all endpoints.
   - Add endpoint `GET /sessions/{session_id}/review`.

### Phase 5: Contracts, Frontend Sync & Cleansing
1. Run `make generate-api` to regenerate `apps/web/types/api.generated.d.ts`.
2. Update `apps/web/features/game/types.ts`: map new schemas cleanly.
3. Clean `apps/web/features/game/hooks/use-game-turn.ts`: remove obsolete `refetchActiveSession()` fallback re-stitching loop.
4. Add review hook `useGameSessionReview` in `queries.ts`.
5. Run `npm run type-check` (Must pass with 0 errors).

### Phase 6: Automated Testing & Verification
1. Create comprehensive Pytest suite `test/test_game_session_storage.py` testing:
   - Sequential turn answering with append-only log verification.
   - Concurrent submission rejection (anti-race condition).
   - Turn hydration (no future questions leaked).
   - Session review output accuracy.
2. Run `uv run pytest` across all test suites (Must pass 100%).
3. Execute `make check` for complete quality validation.
