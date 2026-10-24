# Feature Specification: Refactor Game Container Architecture

**Feature Branch**: `004-refactor-game-container`

**Created**: 2026-10-24

**Status**: Draft

**Input**: User description: "Tôi muốn refactor lại code UI của phần game @[/Users/nguyenhuynh/Documents/projects/dut-ai-quiz/apps/web/features/game/components/game-container.tsx] , hiện code trong này quá nhiều, tôi muốn refactor lại để tách trách nhiệm ra, quá nhiều state, quá nhiều logic, ..."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Modular State & Logic Isolation (Priority: P1)

As a developer maintaining the game feature, I want game session state, question navigation, timer countdown, and item actions to be encapsulated into focused, reusable custom hooks (`useGameSession`, `useGameTimer`, `useGameItems`, `useGameTurn`) rather than tangled in a monolithic UI component.

**Why this priority**: The current `game-container.tsx` contains over 800 lines mixing API mutations, anti-cheat detection, timer countdowns, item buffs, boss animations, and layout CSS. Isolating state into distinct hooks allows each concern to be understood, debugged, and maintained independently.

**Independent Test**: Verify that each extracted custom hook exposes a clean, strongly-typed API surface per contract definitions in `contracts/game-hooks.md`, with zero TypeScript errors.

**Acceptance Scenarios**:

1. **Given** game session operations (start, answer patch, rehydrate, retry), **When** inspected in code, **Then** they are managed inside dedicated session hooks (`useGameSession`) without mixing with JSX rendering logic.
2. **Given** timer and countdown logic, **When** time ticks or expires, **Then** timer events update inside `useGameTimer` without causing re-renders of heavy question cards.
3. **Given** item purchases and buffs (50-50, Freeze, Double Points, Shield), **When** triggered, **Then** state transitions and gold deductions are managed cleanly inside `useGameItems`.
4. **Given** turn progression and combat animations, **When** answers are submitted or timed out, **Then** combat status and scoring are resolved cleanly inside `useGameTurn`.

---

### User Story 2 - Decomposed UI Component Hierarchy (Priority: P2)

As a developer, I want the visual elements (Navigation Bar, Header HUD, Warning Overlays) to be divided into distinct, single-responsibility presentational subcomponents (`GameTopBar`, `GameHeaderHud`, `GameAlertOverlay`).

**Why this priority**: Monolithic templates make styling changes (like responsiveness, height auto-expansion, scrollbar handling) risky and difficult to trace. Extracting presentational subcomponents makes layout and styling clean and maintainable.

**Independent Test**: Verify that each extracted component renders accurately according to contracts in `contracts/game-components.md` with explicit, minimal props.

**Acceptance Scenarios**:

1. **Given** top navigation and theme switcher, **When** rendered, **Then** `GameTopBar` handles back navigation and theme toggling independently.
2. **Given** stage challenge progress dots and score display, **When** rendered, **Then** `GameHeaderHud` encapsulates progress indicators cleanly.
3. **Given** boss warning alerts, **When** triggered, **Then** `GameAlertOverlay` displays the animated warning banner without polluting main arena JSX.

---

### User Story 3 - Seamless Gameplay Orchestration & Zero Functional Regression (Priority: P1)

As a learner and developer, I want `GameContainer` to act as a lightweight orchestrator under 200 lines coordinating hooks and subcomponents, while guaranteeing 100% zero-regression gameplay, responsive scrolling for long questions, and flawless anti-cheat detection.

**Why this priority**: The orchestrator ties together all decoupled hooks and UI components into a complete match experience that learners interact with.

**Independent Test**: Can be verified by running a complete match: starting the match, answering questions correctly and incorrectly, utilizing support items (Microscope 50-50, Time Freeze, Double Points, Shield), triggering boss attacks/animations, and reaching the victory/defeat summary screen with full score accuracy per `quickstart.md`.

**Acceptance Scenarios**:

1. **Given** `GameContainer`, **When** line count is measured, **Then** it is under 200 lines and acts purely as an orchestrator.
2. **Given** an active question, **When** the user clicks an answer option, **Then** immediate visual feedback is rendered, attack/damage animations fire on the arena, and score/HP updates accurately.
3. **Given** lengthy questions with code snippets or LaTeX math, **When** displayed, **Then** viewport auto-expands and scrolls smoothly without clipping content.
4. **Given** browser tab switching, **When** user blurs window, **Then** anti-cheat toast warning triggers and penalizes player according to lesson configuration.
5. **Given** the final question is completed or player HP reaches 0, **When** game ends, **Then** the GameResult view is displayed with accurate final score, gold earned, and retry option.

---

### Edge Cases

- **Fast Multi-Clicking**: What happens when a user clicks multiple answer options or item buttons in rapid succession? (State must block further clicks once an action is pending).
- **Simultaneous Timeout & Click**: What happens when the timer reaches 0:00 at the exact millisecond the user clicks an answer? (Game turn logic must resolve cleanly to either timeout or submission without race conditions).
- **Tab Switching / Background Throttling**: What happens when the user switches tabs while the timer is running? (Anti-cheat must detect the violation and timer must handle synchronization gracefully).
- **Session Replay / Retry**: What happens when the user clicks retry? (All temporary buffs, cooldowns, eliminated options, and timer flags must be thoroughly reset to initial values).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST preserve all existing game rules, mechanics, point calculations, gold spending, and boss damage calculations without alteration.
- **FR-002**: The game UI architecture MUST be decoupled into distinct responsibility layers:
  - **Hooks Layer**: Business logic, API mutations, timer intervals, anti-cheat detection, and turn state.
  - **Component Layer**: Visual presentation components (Header HUD, Alert Popups, Game Layout Viewport, Arena Columns).
  - **Container/Orchestrator Layer**: A lightweight `GameContainer` component coordinating hooks and passing clean props to presentation components.
- **FR-003**: The codebase MUST isolate item usage handling (Microscope, Freeze, Double Points, Shield) into a cohesive domain logic unit.
- **FR-004**: The anti-cheat integration MUST remain functional, detecting window blur and tab switching, displaying warning toasts and penalizing HP as defined in current game rules.
- **FR-005**: Game session initialization, retry flows, and initial loading states MUST be handled with clear state transitions (`start` -> `playing` -> `result`).
- **FR-006**: Viewport layout and responsive scroll behavior MUST ensure questions and answers of any length are fully viewable without getting trapped behind rigid overflow constraints.

### Key Entities *(include if feature involves data)*

- **GameSessionState**: Represents the active game session ID, current question list, stage level, player HP, boss HP, gold, and current score.
- **TurnState**: Represents the ephemeral state for the active question: selected option, answered status, correctness, active buffs (double, shield, freeze), and eliminated options (50-50).
- **ItemAction**: Represents the purchase, validation, and activation of gameplay power-ups.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The line count of `game-container.tsx` is reduced by at least 65% (from 814 lines down to <= 200 lines).
- **SC-002**: 100% of core gameplay behaviors (answering, 4 item actions, boss defeat/damage, timeouts, retry, anti-cheat) pass manual and automated verification with zero regressions.
- **SC-003**: No single newly created component or hook exceeds 250 lines of code.
- **SC-004**: Re-renders triggered by 1-second timer ticks are isolated to timer/HUD elements, avoiding unnecessary re-renders of the full question card and options list.

## Assumptions

- The backend APIs (`/api/v1/game/session`, `/api/v1/game/answer`, `/api/v1/game/items`) remain unchanged; this is strictly a frontend client architecture refactoring.
- The visual design system (cartoon RPG style, border strokes, colors, badges, sound effects, animations) remains identical.
- Existing shared dependencies (`framer-motion`, `sonner`, `lucide-react`, React Query hooks) continue to be utilized.
