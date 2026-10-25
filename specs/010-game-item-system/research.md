# Research & Architectural Decisions: Extensible Game Item System

**Feature**: `010-game-item-system`  
**Date**: 2026-10-25  

## 1. Context & Problem Statement

In the current implementation of `UseItemGameUseCase` (`apps/api/app/application/use_cases/game/use_item_game.py`), item handling is tightly coupled and imperative:
- Line 58–80 uses an `if-elif-else` ladder to check `item == GamificationItem.MICROSCOPE` vs `GamificationItem.TIME_FREEZE`.
- Specific business logic (e.g., retrieving question options, filtering correct vs incorrect choices, random sampling 2 options, activating time freeze flags) is implemented directly inside the use case method body.
- Adding a new item requires modifying `UseItemGameUseCase`, violating the Open/Closed Principle (OCP).
- State mutations and validation checks are fragmented: the use case computes gold price, deducts gold, and decides what fields to return.

## 2. Architectural Decisions & Patterns

### Decision 1: Strategy Pattern with `ItemExecutionContext`

- **Decision**: Define a standardized strategy abstraction `IGameItemStrategy` where each item implements:
  - `item_type: GamificationItem`: The item identifier.
  - `is_instant: bool`: Declares if the item is an instant item (used mid-question via `/use-item`) or a turn buff (used via `/answers`).
  - `validate(session: GameSessionEntity, context: ItemExecutionContext) -> None`: Validates preconditions (e.g. tier limits, question validity).
  - `calculate_price(session: GameSessionEntity, context: ItemExecutionContext) -> int`: Determines gold cost (accounting for boss 2x multiplier).
  - `apply(session: GameSessionEntity, context: ItemExecutionContext) -> ItemExecutionResult`: Executes the item's effects, mutates session state, and returns item-specific outcome data.
- **Rationale**: Decouples item business logic from use cases. Encapsulates state decision-making within each item.
- **Alternatives Considered**:
  - *Hardcoded dictionary of functions*: Harder to mock, lacks object-oriented encapsulation for items requiring repository dependencies (like Microscope).
  - *Full Command/Event Sourcing Pattern*: Overkill for synchronous in-memory state mutations within an active session transaction.

### Decision 2: Centralized Strategy Registry (`GameItemRegistry`)

- **Decision**: Introduce a `GameItemRegistry` in `app/application/services/game_items/registry.py`:
  - Maintains a dictionary mapping `GamificationItem -> IGameItemStrategy`.
  - Provides `register(strategy: IGameItemStrategy)` and `get(item_type: GamificationItem) -> IGameItemStrategy`.
  - Raises domain validation exception if an unsupported or unregistered item is requested.
- **Rationale**: Single point of registration. Open for extension: new items are registered at container bootstrap without modifying existing use cases.
- **Alternatives Considered**:
  - *Auto-discovery via subclasses*: Dynamic subclass scanning is brittle in Python packaging and makes static analysis/typing harder. Explicit registration via Dishka is predictable and clean.

### Decision 3: Layering & Dependency Injection

- **Decision**:
  - Domain Layer (`app/domain/interfaces/game_items.py`): Defines `IGameItemStrategy`, `ItemExecutionContext`, `ItemExecutionResult`.
  - Application Layer (`app/application/services/game_items/`): Implements concrete strategies:
    - `MicroscopeItemStrategy`: Injected with `IQuestionRepository` to fetch options and eliminate 2 incorrect answers.
    - `TimeFreezeItemStrategy`: Directly sets time freeze flag and encapsulates time freeze rules.
    - `ShieldItemStrategy` & `DoublePointsItemStrategy`: Declare `is_instant = False` and raise informative domain exceptions if sent to the instant `/use-item` endpoint.
  - DI Container (`apps/api/app/infrastructure/di/`): Registers `GameItemRegistry` and binds it as a singleton/scoped dependency into `UseItemGameUseCase`.
- **Rationale**: Aligns strictly with Principle I (Lightweight DDD) of the project constitution.

### Decision 4: Atomicity & Error Handling

- **Decision**: Gold deduction and session saving remain atomic in the use case coordinator:
  1. Look up strategy from registry.
  2. Run `strategy.validate(session, context)`.
  3. Calculate `price = strategy.calculate_price(session, context)`.
  4. Verify `state.has_enough_gold(price)` (raises `InsufficientResourceException` if not enough).
  5. Deduct gold: `state.deduct_gold(price)`.
  6. Execute `result = await strategy.apply(session, context)`.
  7. Persist session via `self._ps_repo.save(session)`.
- **Rationale**: Ensures if any strategy validation or database fetch fails, no gold is deducted and no partial session mutation is persisted.
