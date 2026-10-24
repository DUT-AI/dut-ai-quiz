# Phase 0: Technical Research & Architectural Decisions

**Feature**: `004-refactor-game-container`
**Date**: 2026-10-24
**Topic**: Decomposing monolithic `game-container.tsx` into modular hooks and presentational subcomponents

---

## 1. State Management & Hook Decomposition

### Decision
Extract game state and operations into 4 focused custom hooks residing in `apps/web/features/game/hooks/`:
1. `useGameSession`: Handles session initialization, snapshot parsing, retry actions, loading states, and backend mutation bindings.
2. `useGameTurn`: Manages active question index, option selection, submit answer mutation, correct/incorrect calculation, points/gold gain, and player/boss attack & damage animations (`bossStatus`).
3. `useGameTimer`: Manages question countdown, time freeze buff, timeLeft reference, and timeout triggers.
4. `useGameItems`: Handles item inventory, validation, backend item mutation (Microscope 50-50, Time Freeze), and local buff activation (Double Points, Shield).

### Rationale
- `game-container.tsx` currently manages ~20 independent `useState` and `useRef` hooks simultaneously, causing state coupling and high cognitive load.
- Encapsulating domain logic into separate hooks provides single-responsibility modules that are easy to reason about, test, and maintain.
- Preserves the existing React Query cache and lifecycle without introducing new external global state libraries.

### Alternatives Considered
- **Zustand Store**: Would add external dependency and lifecycle management complexities for temporary in-match session states that should naturally dispose when navigating away from the game page.
- **Single Monolithic Hook (`useGame`)**: Would just move 600 lines from a component to a single hook file without solving the problem of excessive coupled state.

---

## 2. Presentational Component Decomposition

### Decision
Extract presentational UI sections from `game-container.tsx` into dedicated components in `apps/web/features/game/components/`:
1. `GameTopBar`: Displays "Quay lại Bài học" button and `SwitchTheme`.
2. `GameHeaderHud`: Displays stage progress dots (correct, incorrect, active, locked) and total score counter.
3. `GameAlertOverlay`: Manages the Boss Warning animated banner and screen shake visual feedback.

### Rationale
- Keeps `GameContainer` strictly as an orchestrator (< 200 LOC) that calls the custom hooks and passes props down to clean, declarative components.
- Simplifies CSS styling, eliminates style collisions, and makes each visual piece easily reusable or tweakable.

### Alternatives Considered
- **Inline Helper Render Functions (`renderHeader()`, `renderArena()`)**: Still leaves all JSX and local variables inside `game-container.tsx`, keeping file size massive and re-render profiling difficult.

---

## 3. High-Frequency Timer Re-render Mitigation

### Decision
Maintain the high-performance timer synchronization pattern using a reactive countdown in `useGameTimer` while using `timeLeftRef` for exact response time tracking during answer submissions.

### Rationale
- Questions often contain complex Markdown, KaTeX formulas, and syntax-highlighted Python code.
- By isolating the 1-second countdown inside `useGameTimer` and keeping `BossHud`'s `CircularTimer` lightweight, we avoid triggering unnecessary re-parses of Markdown content on every second tick.

---

## 4. Zero-Regression Verification Strategy

### Decision
Ensure all props, callbacks, and mutation payloads match existing contracts in `features/game/types.ts` and `queries.ts`.
- Verify every item type (`50-50`, `freeze`, `double`, `shield`) behaves identically.
- Ensure anti-cheat listeners (`useAntiCheat`) continue triggering HP penalty and warning alerts.
- Ensure smooth scrolling behavior and full visibility of lengthy questions.
