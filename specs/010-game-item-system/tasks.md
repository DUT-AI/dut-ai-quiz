# Tasks: Extensible Game Item System & Strategy Pattern

**Branch**: `010-game-item-system` | **Date**: 2026-10-25 | **Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create value objects and directory structure for the extensible item system

- [x] T001 Initialize strategy module directories in `apps/api/app/domain/interfaces/` and `apps/api/app/application/services/game_items/`
- [x] T002 [P] Create domain value objects in `apps/api/app/domain/value_objects/game_items.py` with `ItemExecutionContext` (`question_id: UUID`, `current_question_meta: QuestionMeta`, `question_repo: IQuestionRepository`) and `ItemExecutionResult` (`item_name: str`, `eliminated_option_ids: list[str]`, `time_freeze_active: bool`, `metadata: dict[str, Any]`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core Strategy abstraction and Registry that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T003 Create `IGameItemStrategy` abstract base interface in `apps/api/app/domain/interfaces/game_items.py` specifying `item_type: GamificationItem`, `is_instant: bool`, `validate(session: GameSessionEntity, context: ItemExecutionContext) -> None`, `calculate_price(session: GameSessionEntity, context: ItemExecutionContext) -> int`, and `apply(session: GameSessionEntity, context: ItemExecutionContext) -> ItemExecutionResult`
- [x] T004 Implement `GameItemRegistry` in `apps/api/app/application/services/game_items/registry.py` with `register(strategy: IGameItemStrategy)`, `get(item_type: GamificationItem)`, and `get_by_name(name: str)`
- [x] T005 [P] Register `GameItemRegistry` and its strategy bindings in Dishka dependency injection container in `apps/api/app/infrastructure/di/container.py`

**Checkpoint**: Foundation ready - item strategy implementations and use case refactoring can proceed

---

## Phase 3: User Story 1 - Dynamic & Isolated Instant Item Activation (Priority: P1) 🎯 MVP

**Goal**: Enable players to activate instant items (`microscope` and `time_freeze`) through dedicated strategy handlers with encapsulated validation, pricing, and state mutation, eliminating procedural code from `UseItemGameUseCase`.

**Independent Test**: Can be tested by invoking `POST /game/sessions/{id}/use-item` with item `microscope` or `time_freeze`, verifying option elimination and freeze flag updates without regression.

### Tests for User Story 1 ⚠️

- [x] T006 [P] [US1] Create unit tests for `MicroscopeItemStrategy` and `TimeFreezeItemStrategy` in `apps/api/test/test_game_item_strategies.py` verifying pricing (normal vs boss 2x), option elimination logic, and freeze flag mutation

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement `MicroscopeItemStrategy` in `apps/api/app/application/services/game_items/microscope.py` handling `GamificationItem.MICROSCOPE`, base price 50 (boss price 100), querying options via `IQuestionRepository`, sampling 2 incorrect options, and returning `eliminated_option_ids`
- [x] T008 [P] [US1] Implement `TimeFreezeItemStrategy` in `apps/api/app/application/services/game_items/time_freeze.py` handling `GamificationItem.TIME_FREEZE`, base price 40 (boss price 80), and returning `time_freeze_active = True`
- [x] T009 [US1] Refactor `UseItemGameUseCase` in `apps/api/app/application/use_cases/game/use_item_game.py` to resolve strategy from `GameItemRegistry`, execute validation, deduct gold atomically, call `strategy.apply()`, and return `GamificationUseItemResultOut`
- [x] T010 [US1] Update use case tests in `apps/api/test/test_game_unit.py` to test instant item execution through `UseItemGameUseCase` with the refactored registry

**Checkpoint**: User Story 1 complete - instant items operate purely via strategy dispatch and all existing tests pass

---

## Phase 4: User Story 2 - Plug-and-Play Strategy Extensibility for New Items (Priority: P2)

**Goal**: Ensure the item subsystem supports adding new items seamlessly by creating a strategy class and registering it, with zero modifications to `UseItemGameUseCase`.

**Independent Test**: Register a custom dummy item strategy in the registry and verify it executes via `UseItemGameUseCase` without altering use case code.

### Tests for User Story 2 ⚠️

- [x] T011 [P] [US2] Implement unit test in `apps/api/test/test_game_item_strategies.py` for registering a custom/mock item strategy and verifying dynamic dispatch and execution
- [x] T012 [P] [US2] Implement unit test in `apps/api/test/test_game_item_strategies.py` verifying that requesting an unknown item name raises `DomainValidationException("Invalid item: {name}")`

### Implementation for User Story 2

- [x] T013 [US2] Implement `TurnBuffItemStrategy` in `apps/api/app/application/services/game_items/turn_buff.py` for `GamificationItem.DOUBLE_POINTS` and `GamificationItem.SHIELD` with `is_instant = False`, raising `DomainValidationException("Item {item_name} must be activated when submitting your answer")` if invoked via the instant endpoint

**Checkpoint**: User Story 2 complete - new items can be added with zero changes to the use case, and turn buffs reject instant use gracefully

---

## Phase 5: User Story 3 - Encapsulated State Decisions & Item Lifecycle Rules (Priority: P3)

**Goal**: Ensure item pricing (including boss encounter 2x multiplier), prerequisite checks, and tier constraints are completely encapsulated inside strategies rather than hardcoded in use cases.

**Independent Test**: Verify that all pricing multipliers (boss vs normal) and validation constraints (session in progress, question ID matching) are executed cleanly through strategy methods.

### Tests & Verification for User Story 3 ⚠️

- [x] T014 [P] [US3] Add unit tests in `apps/api/test/test_game_item_strategies.py` validating edge cases: question with < 2 incorrect options, session not in progress, and mismatched question ID
- [x] T015 [US3] Verify atomic transaction behavior in `apps/api/test/test_game_item_strategies.py`: ensure gold is not deducted and session is not saved if strategy validation or option retrieval fails

**Checkpoint**: User Story 3 complete - edge cases and atomic error handling fully tested

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Cleanup, module exports, linting, and full regression verification

- [x] T016 [P] Update domain module exports in `apps/api/app/domain/interfaces/__init__.py` and `apps/api/app/domain/value_objects/__init__.py`
- [x] T017 [P] Run code formatting and lint verification (`uv run ruff check apps/api` and `uv run ruff format --check apps/api`)
- [x] T018 Run full test suite (`uv run pytest apps/api/test/`) and execute scenario validations per `specs/010-game-item-system/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Phase 2 - Delivers MVP instant item execution
- **User Story 2 (Phase 4)**: Depends on Phase 2 & Phase 3 - Delivers OCP extensibility & turn buff strategy
- **User Story 3 (Phase 5)**: Depends on Phase 3 & Phase 4 - Hardens edge cases & atomic error handling
- **Polish (Phase 6)**: Depends on all user story phases complete

### Parallel Opportunities

- In Phase 1: `T002` can be implemented alongside directory setup `T001`
- In Phase 2: `T005` (DI container) can be prepared alongside `T004` (Registry)
- In Phase 3: `T006` (Tests), `T007` (Microscope), and `T008` (Time Freeze) can be implemented in parallel across separate files
- In Phase 4: `T011` and `T012` test cases can be written in parallel
- In Phase 6: `T016` (exports) and `T017` (ruff) can run in parallel

---

## Implementation Strategy

### MVP First (Phases 1, 2, 3)
1. Complete Setup (`T001`-`T002`) and Foundational (`T003`-`T005`).
2. Implement `MicroscopeItemStrategy` (`T007`) and `TimeFreezeItemStrategy` (`T008`).
3. Refactor `UseItemGameUseCase` (`T009`) to use `GameItemRegistry`.
4. Validate MVP via unit tests (`T006`, `T010`).

### Incremental Delivery (Phases 4, 5, 6)
1. Add `TurnBuffItemStrategy` and extensibility tests (`T011`-`T013`).
2. Add edge case tests and verify atomic rollbacks (`T014`-`T015`).
3. Polish exports, run linter, and verify full 149+ test suite (`T016`-`T018`).
