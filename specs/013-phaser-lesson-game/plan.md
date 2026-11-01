# Implementation Plan: 2D Cartoon Browser Game Engine with Phaser in Lesson UI

**Branch**: `013-phaser-lesson-game` | **Date**: 2026-11-01 | **Spec**: [specs/013-phaser-lesson-game/spec.md](file:///Users/nguyenhuynh/Documents/projects/dut-ai-quiz/specs/013-phaser-lesson-game/spec.md)

**Input**: Feature specification from `specs/013-phaser-lesson-game/spec.md`

## Summary

Integrate a real 2D game engine (Phaser 4) into a dedicated Game v2 experience on route `/game_v2` (and `/lessons/[slug]/game_v2`) within Next.js (`apps/web`). In Game v2, the Phaser canvas replaces the legacy static `BossHud` with a dynamic 2D cartoon battle arena featuring animated Shield Knight (player) and Void Reaper (boss), layered parallax backgrounds, camera shake, particle effects, cartoon dialogue bubbles, adaptive stage RPG music, and floating nametags. The React question card, markdown parsing, timer, anti-cheat, and session management remain authoritative in React and communicate with the Phaser scene via a decoupled, typed event bridge (`PhaserGameBridge`). The existing `/lessons/[slug]/game` (v1) remains completely untouched.

## Technical Context

**Language/Version**: TypeScript 5.3+, Next.js 14.1.4 (App Router), React 18  
**Primary Dependencies**: `phaser` (Phaser 4), `@tanstack/react-query`, `lucide-react`, `tailwindcss`  
**Storage**: Client local state / React state machine, server API for session persistence  
**Testing**: Playwright (`@playwright/test`), Vitest / Jest, TypeScript compiler (`tsc --noEmit`)  
**Target Platform**: Modern Web Browsers (Chrome, Firefox, Safari, Edge) with WebGL/Canvas2D support  
**Project Type**: Web Application (Embedded 2D Game Engine in Next.js)  
**Performance Goals**: Solid 60 FPS in canvas rendering, zero memory leaks during page navigation or HMR, initial game asset load < 1.5s  
**Constraints**:
- Primary Route: `/lessons/[slug]/game_v2` (`apps/web/app/(root)/lessons/[slug]/game_v2/page.tsx`), keeping `/lessons/[slug]/game` unchanged
- Strict Modular Decomposition: Zero monolithic files. Each subsystem, entity, and component must have its own dedicated file (< 250 LOC per module)
- Dynamic client mount only (`ssr: false`) to prevent Next.js SSR WebGL/window crashes
- No placeholder rectangles for character art (use existing assets in `apps/web/public/assets/shield-knight-FREE` and `faceless-void-reaper-FREE`)
- Game logic decoupled from visual rendering (React holds quiz/turn state, Phaser acts as presentation engine)  
**Scale/Scope**: All lesson games across the platform

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Evaluation | Status |
|-----------|------------|--------|
| **I. Lightweight DDD** | No changes required to backend domain logic; frontend feature remains isolated. | PASSED |
| **II. Contract-Driven** | Strict event contracts defined in `contracts/game-bridge-events.ts` and `contracts/phaser-arena-interface.ts`. | PASSED |
| **III. Feature-First Frontend** | All new components, hooks, scenes, and managers reside inside `apps/web/features/game/`. | PASSED |
| **IV. Test-Driven Verification** | Playwright test covers canvas rendering, event bridge, and turn outcome animations; `npm run type-check` required. | PASSED |
| **V. Authority & State Separation** | React (`useGameTurn`, `useGameSession`) maintains authoritative quiz state and scoring; Phaser handles purely visual rendering and animations. | PASSED |

## Project Structure

### Documentation (this feature)

```text
specs/013-phaser-lesson-game/
├── spec.md              # Feature specification
├── plan.md              # Implementation plan (this file)
├── research.md          # Technical research & architectural decisions
├── data-model.md        # Domain entities, models, state machines
├── quickstart.md        # Manual and automated verification guide
└── contracts/           # Interface and event contracts
    ├── game-bridge-events.ts
    └── phaser-arena-interface.ts
```

### Source Code (repository root)

```text
apps/web/
├── app/
│   └── (root)/
│       ├── game_v2/
│       │   └── page.tsx                    # Route: /game_v2 (Direct access + query param)
│       └── lessons/
│           └── [slug]/
│               ├── game/
│               │   └── page.tsx            # Existing Game v1 route (UNTOUCHED)
│               └── game_v2/
│                   └── page.tsx            # Route: /lessons/[slug]/game_v2
├── features/game/
│   ├── components/
│   │   ├── game-container.tsx              # Game v1 container (UNTOUCHED)
│   │   ├── game-container-v2.tsx           # Game v2 container (Houses PhaserArena + Quiz UI)
│   │   └── phaser/
│   │       ├── phaser-arena.tsx            # Dynamic React wrapper for Phaser Game Canvas
│   │       ├── phaser-game-bridge.ts       # Decoupled Event Bus between React and Phaser
│   │       └── scenes/
│   │           ├── battle-arena-scene.ts   # Main Battle Scene (Characters, Background, Camera, FX)
│   │           ├── entities/
│   │           │   ├── character-entity.ts # Reusable Animated Character (Knight, Reaper)
│   │           │   └── dialogue-bubble.ts  # Cartoon Dialogue & Nametag visual component
│   │           └── systems/
│   │               ├── animation-system.ts # Parses ANIMATION-INDEX.json and creates Phaser animations
│   │               ├── particle-system.ts  # Hit sparks, slash effects, magical auras
│   │               ├── parallax-system.ts  # Multi-layer parallax background manager
│   │               └── audio-system.ts     # Adaptive stage BGM, loops.json reader, volume & mute manager
│   └── hooks/
│       └── use-phaser-bridge.ts            # Hook connecting useGameTurn with PhaserGameBridge
└── tests/
    └── e2e/
        └── phaser-game-arena.spec.ts       # Playwright E2E verification test for /game_v2
```

**Structure Decision**: Fully encapsulated within `apps/web/features/game/components/phaser/` in compliance with Feature-First architecture.

## Complexity Tracking

*No constitutional violations identified. Standard feature-first structure with clean event-driven decoupling.*
