# Feature Specification: Extensible Game Item System & Strategy Pattern

**Feature Branch**: `010-game-item-system`

**Created**: 2026-10-25

**Status**: Draft

**Input**: User description: "Tôi muốn khái quát hóa phần sử dụng item thành 1 giải pháp tổng quan để mở rộng sau này, hiện tại code cứ bị if else, logic cập nhật state sẽ đưa cho từng item quyết định session này, thay vì hard code vào use case"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Dynamic & Isolated Instant Item Activation (Priority: P1)

As a quiz player in an active arena session,
I want to use instant support items (such as Microscope or Time Freeze) during a question,
So that the item effect takes place reliably, costs are deducted accurately, and the game state updates instantly without any hardcoded execution coupling.

**Why this priority**: Core gameplay loop. Players rely on instant support items to navigate challenging questions and boss fights. Each item must execute its own isolated business rules (e.g. option elimination, timer freeze) without depending on hardcoded procedural `if-elif-else` branches in the use case.

**Independent Test**: Can be tested by invoking `POST /game/sessions/{id}/use-item` with item `microscope` or `time_freeze`, verifying that the item strategy registry resolves the appropriate handler, validates prerequisites, mutates session state, and returns the expected result payload with updated gamification metrics.

**Acceptance Scenarios**:

1. **Given** an active question with 4 options and a player with >= 50 gold,
   **When** the player uses the `microscope` item,
   **Then** the microscope strategy eliminates 2 random incorrect options, deducts 50 gold (or 100 in boss mode), and returns the eliminated IDs along with the updated gamification state.
2. **Given** an active question and a player with >= 40 gold,
   **When** the player uses the `time_freeze` item,
   **Then** the time freeze strategy activates the freeze flag, deducts 40 gold (or 80 in boss mode), and returns `time_freeze_active = true` along with updated gamification state.
3. **Given** a player attempting to use an item without enough gold,
   **When** the item handler executes validation,
   **Then** the system rejects the request with an `InsufficientResourceException` (400) and no state or gold is mutated.

---

### User Story 2 - Plug-and-Play Strategy Extensibility for New Items (Priority: P2)

As a game backend developer or content designer,
I want to add new items (such as hints, 50-50 variations, or HP potions) simply by registering a new item strategy class,
So that new gameplay mechanics can be introduced without modifying the core `UseItemGameUseCase` or touching existing item logic.

**Why this priority**: Directly addresses the Open/Closed Principle (OCP) and eliminates technical debt. Previously, adding or altering any item required modifying conditional ladders in `use_item_game.py`, creating high risk of regressions across unrelated items.

**Independent Test**: Can be tested by creating a dummy/new item strategy (e.g., `TestBonusItemStrategy`), registering it in the `GameItemRegistry`, and verifying that `POST /game/sessions/{id}/use-item` executes the new strategy cleanly without changing a single line of `UseItemGameUseCase`.

**Acceptance Scenarios**:

1. **Given** a registered item strategy implementing the standardized item contract,
   **When** a request arrives for that item name,
   **Then** the item registry dynamically dispatches execution to that strategy.
2. **Given** a request for an unregistered or unknown item name,
   **When** the registry attempts lookup,
   **Then** the system returns a domain validation error stating the item is unsupported or invalid.
3. **Given** a turn-based buff item (e.g. `shield`, `double_points`) sent to the instant use-item endpoint,
   **When** the strategy's activation lifecycle check runs,
   **Then** the strategy clearly informs the caller that the item must be submitted with an answer turn rather than executed mid-question.

---

### User Story 3 - Encapsulated State Decisions & Item Lifecycle Rules (Priority: P3)

As a game systems architect,
I want each item strategy to encapsulate its own prerequisite checks, pricing rules, and state transformation logic,
So that item-specific domain rules (such as boss price multipliers, cooldowns, or tier limits) live inside the item's domain boundary rather than polluting generic game session code.

**Why this priority**: Maintainability and separation of concerns. Items have varying rules: some need question repository access (Microscope), some mutate timer flags (Time Freeze), and some restrict usage per tier (Shield). Encapsulating these rules within individual strategies keeps the game session clean and testable.

**Independent Test**: Unit test each item strategy in complete isolation with mock session entities to verify that validation, pricing, and state transition logic are 100% self-contained.

**Acceptance Scenarios**:

1. **Given** a boss encounter question (`is_boss = true`),
   **When** an item calculates its required cost,
   **Then** the pricing logic applies the 2x multiplier defined by item rules.
2. **Given** an item with special prerequisites (e.g. question must have at least 2 incorrect options),
   **When** prerequisites are not satisfied,
   **Then** the strategy raises a domain validation exception before mutating session state.

---

### Edge Cases

- **Item Used After Session Completion**: Submitting `/use-item` when session status is not `IN_PROGRESS` immediately raises a domain validation error.
- **Mismatched Question ID**: Attempting to use an item for a `question_id` that does not match the active `current_question` raises a domain validation error.
- **Exhausted Options for Elimination**: If a question has fewer than 2 incorrect options, the microscope strategy safely returns all available incorrect options without crashing or raising index errors.
- **Duplicate Instant Item Calls**: If a player calls `time_freeze` twice in the same turn, each call validates gold and extends/activates freeze according to the item's defined strategy policy.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST define an abstract item strategy interface (`IGameItemStrategy` or equivalent) specifying the contract for item execution: item identifier, activation timing (instant vs. turn buff), prerequisite validation, pricing calculation, and state application.
- **FR-002**: The system MUST provide an Item Execution Context (`ItemExecutionContext`) containing all necessary contextual dependencies (e.g. current session, question repository, active question metadata) required by strategies during execution.
- **FR-003**: The system MUST implement a centralized `GameItemRegistry` responsible for registering, discovering, and providing item strategies based on item type/name.
- **FR-004**: The system MUST encapsulate the logic for `MICROSCOPE` into a dedicated `MicroscopeItemStrategy`, handling question retrieval, incorrect option selection, and state mutation.
- **FR-005**: The system MUST encapsulate the logic for `TIME_FREEZE` into a dedicated `TimeFreezeItemStrategy`, handling timer freeze activation and state mutation.
- **FR-006**: The system MUST refactor `UseItemGameUseCase` to act strictly as a coordinator that resolves the strategy from `GameItemRegistry` and delegates validation, pricing, and execution, removing all hardcoded `if-elif-else` ladders.
- **FR-007**: The system MUST ensure gold deduction and session persistence remain atomic: if an item strategy fails validation or throws an error, zero gold is deducted and no session state is saved.
- **FR-008**: The system MUST preserve backward compatibility with existing API contracts (`GamificationUseItemIn` and `GamificationUseItemResultOut`), ensuring zero breaking changes to frontend clients.
- **FR-009**: The system MUST provide comprehensive unit tests for each concrete item strategy and registry lookup in `apps/api/test/`.

### Key Entities *(include if feature involves data)*

- **`IGameItemStrategy`**: Abstract strategy interface representing an individual game item. Defines properties (`item_type`, `is_instant`), validation logic (`validate`), pricing calculation (`calculate_price`), and state application (`apply`).
- **`ItemExecutionContext`**: Value object encapsulating contextual runtime data passed to item strategies (session entity, active question metadata, question repository).
- **`ItemExecutionResult`**: Domain value object returned by item strategies containing item-specific outcome data (e.g., `eliminated_options`, `time_freeze_active`).
- **`GameItemRegistry`**: Service managing the mapping between item types and their corresponding strategy implementations.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: `UseItemGameUseCase` cyclomatic complexity is reduced by at least 60% with zero conditional branches (`if/elif/else`) checking item types.
- **SC-002**: Adding a new instant item requires creating exactly 1 strategy class and 1 registry entry, with 0 modifications to `UseItemGameUseCase`.
- **SC-003**: 100% of existing backend tests (149/149) pass without regressions, along with new unit tests covering item strategies and registry dispatch.
- **SC-004**: Item execution response time remains under 25ms under standard server conditions.

## Assumptions

- Instant items (`microscope`, `time_freeze`) continue to be consumed via `POST /game/sessions/{id}/use-item`.
- Turn-based buffs (`shield`, `double_points`) continue to be passed in `PATCH /game/sessions/{id}/answers` for turn resolution, but their pricing and validation rules will align with the strategy pattern foundations established here.
- Dishka dependency injection can easily bind and inject the `GameItemRegistry` or strategies into application use cases.
