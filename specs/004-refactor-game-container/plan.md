# Implementation Plan: Refactor Game Container Architecture

**Branch**: `004-refactor-game-container` | **Date**: 2026-10-24 | **Spec**: [spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/004-refactor-game-container/spec.md)

**Input**: Feature specification from `/specs/004-refactor-game-container/spec.md`

## Summary

Refactor the monolithic `game-container.tsx` (>800 lines) by extracting business logic, API mutations, timers, and item handling into 4 dedicated custom hooks (`useGameSession`, `useGameTurn`, `useGameTimer`, `useGameItems`) and decomposing presentational blocks into 3 focused subcomponents (`GameTopBar`, `GameHeaderHud`, `GameAlertOverlay`). `GameContainer` will be transformed into a clean, readable orchestrator under 200 lines while guaranteeing 100% zero-regression gameplay and smooth scroll responsiveness.

## Technical Context

**Language/Version**: TypeScript 5.x / Next.js 14+ (React 18 client component)

**Primary Dependencies**: React (`useState`, `useEffect`, `useRef`, `useMemo`, `useCallback`), Framer Motion (`motion`, `AnimatePresence`), Sonner (`toast`), Lucide React icons, TanStack React Query (`useStartGameSession`, `usePatchGameAnswer`, `useUseGameItem`, `useActiveGameSession`).

**Storage**: Server state via REST API endpoints (`/api/v1/game/*`) managed by React Query; local match ephemeral state in memory.

**Testing**: Manual E2E validation against the 7 scenarios in [quickstart.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/004-refactor-game-container/quickstart.md) + TypeScript strict compile check (`tsc --noEmit`).

**Target Platform**: Modern desktop & mobile web browsers (Chrome, Safari, Firefox, Edge).

**Project Type**: Web frontend feature module (`apps/web/features/game`).

**Performance Goals**: 60fps animations, isolated 1-second countdown ticks that do not re-render heavy question/code markdown cards.

**Constraints**: Zero regression on point calculations, gold costs, heart deductions, and anti-cheat triggers; questions with code and math must never be cut off or unscrollable.

**Scale/Scope**: Refactoring strictly contained within `apps/web/features/game/`.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **Principle I: Modularity & Separation of Concerns**: Logic isolated into single-purpose custom hooks; presentation isolated into components.
- [x] **Principle II: Zero Regression**: Preserves every existing prop contract, gameplay animation, and network endpoint.
- [x] **Principle III: Clean Code & Readability**: Reduces `game-container.tsx` from 814 LOC to < 200 LOC, with no newly created file exceeding 250 LOC.
- [x] **Principle IV: Verified Contracts**: All hook signatures and component props are strictly typed in [contracts/](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/004-refactor-game-container/contracts).

## Project Structure

### Documentation (this feature)

```text
specs/004-refactor-game-container/
├── spec.md               # Feature specification
├── plan.md               # This implementation plan
├── research.md           # Phase 0 architectural decisions
├── data-model.md         # Phase 1 state machine & hook return models
├── contracts/            # Phase 1 interfaces & contracts
│   ├── game-hooks.md
│   └── game-components.md
├── quickstart.md         # Phase 1 validation scenarios
└── checklists/
    └── requirements.md   # Spec quality checklist
```

### Source Code Layout

```text
apps/web/features/game/
├── hooks/
│   ├── use-game-session.ts    # Session lifecycle, snapshot parsing & retry
│   ├── use-game-turn.ts       # Option selection, scoring & combat animations
│   ├── use-game-timer.ts      # Countdown interval, freeze buff & timeout trigger
│   └── use-game-items.ts      # 50-50, Freeze, Double Points & Shield handlers
├── components/
│   ├── game-top-bar.tsx       # "Quay lại Bài học" & SwitchTheme navigation
│   ├── game-header-hud.tsx    # Stage progress dots & score counter
│   ├── game-alert-overlay.tsx # Animated red boss warning modal
│   ├── game-container.tsx     # Streamlined orchestrator (< 200 LOC)
│   ├── boss-hud.tsx           # Existing arena combat component (preserved)
│   ├── game-question-card.tsx # Existing question card component (preserved)
│   ├── item-hotbar.tsx        # Existing item bar (preserved)
│   └── game-result.tsx        # Existing result screen (preserved)
├── queries.ts                 # React Query mutations & queries (preserved)
└── types.ts                   # Domain Zod schemas & TypeScript types (preserved)
```

**Structure Decision**: Place all extracted hooks into a new `hooks/` subfolder inside `features/game/` to follow the project's feature-based architecture standard. Create focused presentational subcomponents in `components/`.

## Complexity Tracking

| Aspect | Decision | Justification |
|---|---|---|
| State Strategy | Custom React Hooks | Fits naturally into existing React Query patterns without adding extra global state libraries like Zustand or Redux for short-lived match screens. |
| Re-renders | Ref + targeted callbacks | Prevents the 1s interval in `useGameTimer` from re-rendering the heavy Markdown/KaTeX tree inside `GameQuestionCard`. |
