# Tasks: Clean Game Session API Contract & Dead Code Elimination

**Feature Branch**: `009-clean-game-contract-dead-code`  
**Input**: Design documents from `/specs/009-clean-game-contract-dead-code/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Audit and prepare the codebase for contract unification and dead code removal.

- [X] T001 [P] Audit all occurrences of `tags_filter`, `GameSessionSnapshotOut`, and legacy `snapshot` properties across `apps/api/` and `apps/web/`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core model and schema cleanups that MUST be complete before updating use cases and endpoints.

**⚠️ CRITICAL**: No use case or endpoint modifications can begin until foundational schemas and entity models are updated.

- [X] T002 [P] Purge transitional shims (remove `tags_filter` constructor arg/field, `@property tags_filter`, and `@property snapshot`) from `GameSessionEntity` in `apps/api/app/domain/entities/game.py`
- [X] T003 [P] Delete legacy standalone helpers (`hydrate_question_snapshot`, `hydrate_session_start_out`) at module level in `apps/api/app/application/services/game_hydration.py`
- [X] T004 Define unified `GameSessionOut` schema and prune `snapshot` field from `GamificationAnswerResultOut` in `apps/api/app/presentation/schemas/game.py`
- [X] T005 Implement `to_session_out` and `to_history_out` mapping methods on `GameHydrationService` in `apps/api/app/application/services/game_hydration.py`

**Checkpoint**: Core domain entity and presentation DTOs are clean, flat, and ready for use case wiring.

---

## Phase 3: User Story 1 - Streamlined Game Session Initialization and Resumption (Priority: P1) 🎯 MVP

**Goal**: Establish a unified `GameSessionOut` return type for session creation, active session lookup, session details, and manual session completion without nested snapshot containers.

**Independent Test**: Execute `StartGameSessionUseCase`, `GetActiveGameSessionUseCase`, `GetGameSessionUseCase`, and `FinishGameSessionUseCase` to verify they all return `GameSessionOut` with direct attributes (`id`, `user_id`, `lesson_slug`, `status`, `current_question`, `gamification`) and zero `snapshot` nesting.

- [X] T006 [P] [US1] Update `StartGameSessionUseCase` to return `GameSessionOut` via `hydration.to_session_out` in `apps/api/app/application/use_cases/game/start_game_session.py`
- [X] T007 [P] [US1] Update `GetActiveGameSessionUseCase` to return `GameSessionOut | None` in `apps/api/app/application/use_cases/game/get_active_game_session.py`
- [X] T008 [P] [US1] Update `GetGameSessionUseCase` to return `GameSessionOut | None` in `apps/api/app/application/use_cases/game/get_game_session.py`
- [X] T009 [P] [US1] Update `FinishGameSessionUseCase` to return `GameSessionOut | None` in `apps/api/app/application/use_cases/game/finish_game_session.py`
- [X] T010 [US1] Update router endpoints (`POST /sessions`, `GET /sessions/active`, `GET /sessions/{session_id}`, `POST /sessions/{session_id}/finish`) to return `GameSessionOut` in `apps/api/app/presentation/api/routers/game.py`
- [X] T011 [US1] Update unit test assertions in `apps/api/test/test_game_resume.py` and `apps/api/test/test_game_storage_refactor.py` to validate `GameSessionOut`

**Checkpoint**: Session lifecycle endpoints (start, resume, detail, finish) are 100% unified under `GameSessionOut`.

---

## Phase 4: User Story 2 - Lean & High-Precision Turn Evaluation (Priority: P2)

**Goal**: Deliver lean turn resolution feedback upon answering questions without echoing redundant snapshot payloads.

**Independent Test**: Call `PatchGameAnswerUseCase.execute` and assert that `GamificationAnswerResultOut` returns `is_correct`, `points_gained`, `coins_gained`, `updated_gamification`, `next_question`, and completely lacks `snapshot`.

- [X] T012 [US2] Update `PatchGameAnswerUseCase` to return `GamificationAnswerResultOut` without constructing or attaching `snapshot` in `apps/api/app/application/use_cases/game/patch_game_answer.py`
- [X] T013 [US2] Update answer turn tests in `apps/api/test/test_game_unit.py` and `apps/api/test/test_game_storage_refactor.py` for lean `GamificationAnswerResultOut` assertions

**Checkpoint**: Question turns evaluate with minimum payload bloat and zero snapshot dependencies.

---

## Phase 5: User Story 3 - Transparent Match History & Clean Domain Architecture (Priority: P3)

**Goal**: Ensure match history queries return first-class performance metrics cleanly without secondary hydration queries or legacy `tags_filter` arrays.

**Independent Test**: Call `ListGameHistoryUseCase.execute` and assert that every returned item is a `GameSessionOut` with native score and time metrics and no `tags_filter`.

- [X] T014 [US3] Update `ListGameHistoryUseCase` to return `list[GameSessionOut]` via `hydration.to_history_out` in `apps/api/app/application/use_cases/game/list_game_history.py`
- [X] T015 [US3] Update `GET /game/history` router endpoint in `apps/api/app/presentation/api/routers/game.py`
- [X] T016 [US3] Update history and leaderboard unit tests in `apps/api/test/test_game_leaderboard.py` and `apps/api/test/test_get_user_match_history.py`

**Checkpoint**: Backend is completely clean, dead code is eradicated, and 100% of backend tests pass.

---

## Phase 6: Frontend Contract Synchronization (Contract-Driven DDD)

**Purpose**: Propagate the clean OpenAPI contract to the frontend and eliminate client-side snapshot unpacking.

- [X] T017 Synchronize OpenAPI TypeScript contract types by running `make generate-api` to update `apps/web/types/api.generated.d.ts`
- [X] T018 [P] Update frontend game types (`GameSession = Schema<"GameSessionOut">`, remove `GameSnapshot`, remove `tags_filter`) in `apps/web/features/game/types.ts`
- [X] T019 [P] Refactor `use-game-session` hook to consume `sessionData.gamification` and `sessionData.current_question` directly without snapshot unboxing in `apps/web/features/game/hooks/use-game-session.ts`
- [X] T020 [P] Refactor `use-game-turn` hook to consume lean `GamificationAnswerResult` in `apps/web/features/game/hooks/use-game-turn.ts`
- [X] T021 Update `apps/web/features/game/components/game-container.tsx` to handle direct `GameSession` schema attributes

**Checkpoint**: Frontend compiles cleanly against the new OpenAPI contract with zero type errors.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: End-to-end quality validation across the entire monorepo.

- [X] T022 Run backend Pytest suite (`uv run pytest apps/api/test/`) and verify 100% test pass rate
- [X] T023 Run frontend TypeScript type-check and linting (`npm --prefix apps/web run type-check && npm --prefix apps/web run lint`)
- [X] T024 Run full pre-commit verification (`make check`) to validate conflict markers, Ruff linting/formatting, Next.js ESLint, and TypeScript compilation

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies.
- **Foundational (Phase 2)**: Depends on Phase 1 — BLOCKS all user stories.
- **User Story 1 (Phase 3)**: Depends on Phase 2.
- **User Story 2 (Phase 4)**: Depends on Phase 2. Can run parallel to or following US1.
- **User Story 3 (Phase 5)**: Depends on Phase 2. Can run parallel to or following US1/US2.
- **Frontend Contract Sync (Phase 6)**: Depends on Phases 3, 4, and 5 being implemented on the backend.
- **Polish (Phase 7)**: Depends on all prior phases being complete.

### Parallel Opportunities

- Within Phase 2: T002 (`GameSessionEntity`) and T003 (`game_hydration.py`) can run in parallel.
- Within Phase 3: T006, T007, T008, and T009 can be implemented in parallel across use case files.
- Within Phase 6: T018, T019, and T020 can be refactored concurrently once `make generate-api` (T017) finishes.

---

## Implementation Strategy

### MVP Scope (User Story 1 Only)
1. Complete Foundational Phase (Phase 2: clean entity and schemas).
2. Complete User Story 1 (Phase 3: session start, resume, detail, and finish).
3. Verify session lifecycle independently with Pytest.

### Incremental Full Delivery
1. Add User Story 2 (Phase 4: turn patch without snapshot).
2. Add User Story 3 (Phase 5: history listing without tags_filter).
3. Synchronize Frontend (Phase 6: `make generate-api` + hooks refactor).
4. Run `make check` (Phase 7: quality gate).
