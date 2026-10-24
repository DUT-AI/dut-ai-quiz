# Tasks: Arena Game Lifecycle and Turn Synchronization

**Input**: Design documents from `specs/006-arena-lifecycle-sync/`
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/answer-patch.md`

## Organization & Execution Rules
- Strict checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
- `[P]`: Can run in parallel (different files, no conflicting dependencies)
- `[Story]`: User story association (`[US1]`, `[US2]`, `[US3]`)

---

## Phase 1: Setup & Groundwork

**Purpose**: Prepare and verify test environments for backend and frontend.

- [X] T001 Verify baseline backend test suite with `apps/api/test/test_game_timer_verification.py`
- [X] T002 [P] Verify baseline frontend type check with `apps/web/features/game/types.ts`

---

## Phase 2: Foundational Infrastructure

**Purpose**: Core synchronization contracts and state handling.

- [X] T003 Ensure `GamificationAnswerResultOut` in `apps/api/app/presentation/schemas/game.py` properly reflects response fields.
- [X] T004 Implement idempotent answer checking in `apps/api/app/application/use_cases/game/patch_game_answer.py` using `snap.answers`.

---

## Phase 3: User Story 1 - Smooth Continuous Question Answering (Priority: P1) 🎯 MVP

**Goal**: Eliminate `"Question ID does not match current question index"` and ensure uninterrupted question transitions.
**Independent Test**: Complete a multi-question arena match clicking questions sequentially and rapidly without any error toasts.

- [X] T005 [P] [US1] Add backend unit tests verifying idempotent answer submissions in `apps/api/test/test_game_timer_verification.py`
- [X] T006 [US1] Implement synchronous lock `isSubmittingRef` in `apps/web/features/game/hooks/use-game-turn.ts` to block duplicate submit requests.
- [X] T007 [US1] Update `submitAnswer` in `apps/web/features/game/hooks/use-game-turn.ts` to immediately record option selection and unlock safely on errors.
- [X] T008 [US1] Enhance `nextQuestion` in `apps/web/features/game/hooks/use-game-turn.ts` to synchronize `currentIdx` and merge updated question data cleanly.

---

## Phase 4: User Story 2 - Resilient Timeout and Item Buff Execution (Priority: P2)

**Goal**: Prevent timeout and item buffs from targeting out-of-sync or already-answered questions.
**Independent Test**: Let timer run down to 0s to confirm timeout submission does not clash with active turn state; activate 50-50/freeze buffs.

- [X] T009 [P] [US2] Update `handleTimeOut` in `apps/web/features/game/hooks/use-game-turn.ts` to guard against `isAnswered` and `isSubmittingRef.current`.
- [X] T010 [US2] Connect `turn.isAnswered` directly into `useGameTimer` and `useGameItems` in `apps/web/features/game/components/game-container.tsx` instead of hardcoded `false`.
- [X] T011 [P] [US2] Ensure `use_item_game.py` in `apps/api/app/application/use_cases/game/use_item_game.py` verifies valid question index cleanly.

---

## Phase 5: User Story 3 - Instant Question Advancement Without Secondary Fetch Latency (Priority: P3)

**Goal**: Eliminate latency and blanked out questions during question progression.
**Independent Test**: Verify previous questions in memory maintain their content and options when advancing.

- [X] T012 [US3] Merge question snapshots in `use-game-turn.ts` `nextQuestion` so previous questions retain non-empty content and options.
- [X] T013 [P] [US3] Optimize active session query caching in `apps/web/features/game/queries.ts` to prevent stale cache returns.

---

## Phase 6: Polish & Cross-Cutting Verification

**Purpose**: End-to-end audit, test passes, and type checking.

- [X] T014 Run full backend test suite (`pytest apps/api/test/test_game_timer_verification.py`).
- [X] T015 Run frontend type checking (`npx tsc --noEmit --incremental false` in `apps/web`).
- [X] T016 Conduct gameplay verification in Arena mode to confirm 0 error toasts.
- [X] T017 [US1] Implement 10-question distribution (3 Easy, 3 Medium, 4 Hard) with deficit borrowing fallback and 3-stage Boss Fight markers in `start_game_session.py`.
