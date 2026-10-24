# Implementation Plan: Arena Game Lifecycle and Turn Synchronization

**Branch**: `006-arena-lifecycle-sync` | **Date**: 2026-10-24 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/006-arena-lifecycle-sync/spec.md`

## Summary

Resolve the `"Question ID does not match current question index"` error and related synchronization issues between client and server during Arena matches. Implement domain-level answer idempotency on the backend, synchronous state locking (`isSubmittingRef`) on the frontend, and cohesive turn lifecycle management across timers and item buffs.

## Technical Context

**Language/Version**: Python 3.11+ (Backend), TypeScript 5.x / Next.js 15 (Frontend)
**Primary Dependencies**: FastAPI, Dishka, SQLAlchemy, TanStack Query, Framer Motion, Sonner
**Storage**: PostgreSQL (`practice_sessions`, `questions`)
**Testing**: pytest (Backend), TypeScript type checking (`tsc`) (Frontend)
**Target Platform**: Web application (Desktop & Mobile responsive)
**Project Type**: Monorepo Web Application (`apps/api` + `apps/web`)
**Performance Goals**: Instant question transition (< 100ms UI response), 0 race condition errors on rapid clicks
**Constraints**: Zero breaking changes to existing database schema; clean code without ad-hoc patches

## Constitution Check

- Test-First / Verification Required: Pass (pytest test cases covering idempotency and timer reset).
- Simplicity / Clean Code: Pass (Single Source of Truth, removing redundant network roundtrips and fragile state desyncs).

## Project Structure

### Documentation (this feature)

```text
specs/006-arena-lifecycle-sync/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit-plan output)
├── research.md          # Phase 0 architectural findings
├── data-model.md        # Phase 1 state machine & entities
├── quickstart.md        # Phase 1 validation instructions
└── contracts/           # Phase 1 API specifications
    └── answer-patch.md
```

### Source Code

```text
apps/api/app/
├── application/use_cases/game/
│   ├── patch_game_answer.py         # Idempotent answer validation & response
│   └── get_active_game_session.py   # Active timer management
└── presentation/schemas/game.py     # Response schema definition

apps/web/features/game/
├── components/
│   ├── game-container.tsx           # Cohesive hook wiring
│   └── circular-timer.tsx           # Turn lifecycle aware timer
└── hooks/
    ├── use-game-turn.ts             # Synchronous submission lock & question advance
    ├── use-game-timer.ts            # Active turn timer state
    └── use-game-items.ts            # Turn-bounded item activation
```

## Complexity Tracking

No constitution violations detected. Design simplifies state synchronization and removes flaky asynchronous dependencies.
