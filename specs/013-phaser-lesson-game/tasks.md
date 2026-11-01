---
description: "Task list for 2D Cartoon Browser Game Engine with Phaser in Lesson UI (Route /lessons/[slug]/game_v2)"
---

# Tasks: 2D Cartoon Browser Game Engine with Phaser in Lesson UI

**Input**: Design documents from `specs/013-phaser-lesson-game/`  
**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`  
**Route**: Primary route `http://localhost:3000/lessons/[slug]/game_v2` (`apps/web/app/(root)/lessons/[slug]/game_v2/page.tsx`)  
**Architecture Constraint**: Strict modularity (Zero monolithic files; each system/entity in its own dedicated file).

## Format: `- [ ] [TaskID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Mapped to user story (US1, US2, US3, US4, US5)

---

## Phase 1: Setup (Shared Infrastructure & Types)

**Purpose**: Dependency installation, directory scaffolding, and typed contracts.

- [x] T001 Install `phaser` dependency in `apps/web/package.json` (`npm install phaser`)
- [x] T002 [P] Create directory structure for Phaser game v2 components in `apps/web/features/game/components/phaser/`
- [x] T003 [P] Export event contracts and interfaces in `apps/web/features/game/components/phaser/types.ts` based on `contracts/game-bridge-events.ts` and `contracts/phaser-arena-interface.ts`

---

## Phase 2: Foundational (Core Event Bus & Bridge Infrastructure)

**Purpose**: Core communication layer that connects React state machine with Phaser without tight coupling.

**⚠️ CRITICAL**: Foundational modules MUST be complete before user stories can begin.

- [x] T004 Implement decoupled `PhaserGameBridge` event bus in `apps/web/features/game/components/phaser/phaser-game-bridge.ts`
- [x] T005 [P] Implement `usePhaserBridge` custom hook in `apps/web/features/game/hooks/use-phaser-bridge.ts` mediating React turn state transitions to bridge events
- [x] T006 [P] Implement `AnimationSystem` in `apps/web/features/game/components/phaser/systems/animation-system.ts` reading `ANIMATION-INDEX.json` and registering 8-direction sprite animations for Shield Knight and Void Reaper

**Checkpoint**: Core event bus and animation loading ready.

---

## Phase 3: User Story 1 - Real-time 2D Cartoon Battle Arena on Route `/lessons/[slug]/game_v2` (Priority: P1) 🎯 MVP

**Goal**: Deliver a functional 2D canvas arena on `/lessons/[slug]/game_v2` with animated characters (Shield Knight & Void Reaper) running idle animations at 60 FPS, with responsive scaling and zero SSR errors.

**Independent Test**: Navigate to `http://localhost:3000/lessons/[slug]/game_v2`, verify canvas renders at 60 FPS, characters idle smoothly, and `/lessons/[slug]/game` remains completely unchanged.

### Implementation for User Story 1

- [x] T007 [P] [US1] Implement `CharacterEntity` in `apps/web/features/game/components/phaser/entities/character-entity.ts` managing sprite instances, idle/walk animations, HP values, and horizontal facing
- [x] T008 [US1] Implement `BattleArenaScene` in `apps/web/features/game/components/phaser/scenes/battle-arena-scene.ts` setting up 2D camera framing, transparent canvas background, and spawning Player and Boss character entities
- [x] T009 [US1] Implement `PhaserArena` React component in `apps/web/features/game/components/phaser/phaser-arena.tsx` with dynamic client mount (`ssr: false`), responsive resize handling, and WebGL cleanup on unmount
- [x] T010 [US1] Implement `GameContainerV2` in `apps/web/features/game/components/game-container-v2.tsx` assembling `PhaserArena`, `GameTopBar`, `GameQuestionCard`, and `ItemHotbar`
- [x] T011 [US1] Create route page in `apps/web/app/(root)/lessons/[slug]/game_v2/page.tsx` mounting `GameContainerV2` for the specified lesson slug

**Checkpoint**: MVP is fully playable on `/lessons/[slug]/game_v2` with idle characters and quiz card.

---

## Phase 4: User Story 2 - Event-Driven Gameplay Synchronization with Quiz Turns (Priority: P1)

**Goal**: Connect answer submissions from `useGameTurn` to dynamic combat animations (Valiant_Slash, Void_Strike, hit bursts, camera shake, in-engine HP reduction).

**Independent Test**: Submit a correct option: Knight dashes forward, slashes, emits hit particles, and Boss HP bar visibly shrinks. Submit an incorrect option or let timer expire: Boss strikes, camera shakes, and Knight takes damage.

### Implementation for User Story 2

- [x] T012 [P] [US2] Implement `ParticleSystem` in `apps/web/features/game/components/phaser/systems/particle-system.ts` for hit sparks, slash impact bursts, and magic item auras
- [x] T013 [US2] Implement player attack rush and `Valiant_Slash` animation in `apps/web/features/game/components/phaser/entities/character-entity.ts` upon receiving `react:turn_outcome` (correct)
- [x] T014 [US2] Implement boss `Void_Strike` counter-attack, camera shake (`cameras.main.shake`), and player hurt flash in `apps/web/features/game/components/phaser/scenes/battle-arena-scene.ts` upon receiving `react:turn_outcome` (incorrect/timeout)
- [x] T015 [US2] Connect in-engine animated HP bars and emit `phaser:turn_anim_complete` back to React in `apps/web/features/game/components/phaser/scenes/battle-arena-scene.ts` to proceed smoothly to next question

**Checkpoint**: Full combat feedback loop synchronized with quiz turns.

---

## Phase 5: User Story 3 - Visual Systems: Parallax Environment, Floating Nametags & Dialogue Bubbles (Priority: P2)

**Goal**: Enrich the arena with 3-layer parallax backgrounds, floating cartoon nametags, and comic speech bubbles popping up above character heads.

**Independent Test**: Verify camera panning produces multi-layered depth, nametags stay pinned above heads, and cartoon speech bubbles ("Hit!", "Ouch!", "Critical!") appear on turn actions and auto-fade out.

### Implementation for User Story 3

- [x] T016 [P] [US3] Implement `ParallaxSystem` in `apps/web/features/game/components/phaser/systems/parallax-system.ts` managing multi-layered backgrounds with differentiated scroll factors (0.1 sky, 0.4 midground, 1.0 ground)
- [x] T017 [P] [US3] Implement `DialogueBubble` in `apps/web/features/game/components/phaser/entities/dialogue-bubble.ts` for comic-style popups with spring tween animations and pinned character nametags
- [x] T018 [US3] Integrate `ParallaxSystem` and `DialogueBubble` into `BattleArenaScene` in `apps/web/features/game/components/phaser/scenes/battle-arena-scene.ts`

**Checkpoint**: Cartoon visual style with parallax depth, dialogue bubbles, and nametags complete.

---

## Phase 6: User Story 4 - Dynamic Adaptive Music & Audio Management (Priority: P2)

**Goal**: Integrate the RPG music pack from `apps/web/public/assets/gegx-rpg-music-free-v1.0/`, adapting BGM to stages with `loops.json` loop points, victory jingle, and mute/volume control.

**Independent Test**: User clicks to interact -> WebAudio unlocks and stage BGM loops smoothly. Advancing stages triggers smooth 800ms fade-out and new track intro. Toggling mute button silences audio and persists preference. Victory plays jingle.

### Implementation for User Story 4

- [x] T019 [P] [US4] Implement `AudioSystem` in `apps/web/features/game/components/phaser/systems/audio-system.ts` parsing `loops.json` metadata, loading `.ogg` tracks, and managing stage themes (`adventure_begins`, `forest`, `cave`, `abandoned_hall`) and victory jingle
- [x] T020 [US4] Implement WebAudio unlock handler and stage track transitions with 800ms volume cross-fade in `apps/web/features/game/components/phaser/systems/audio-system.ts`
- [x] T021 [US4] Add Mute/Unmute audio toggle button with LocalStorage persistence in `apps/web/features/game/components/game-container-v2.tsx` and bind to `react:set_audio_muted` bridge event

**Checkpoint**: Immersive adaptive RPG soundtrack and audio controls fully operational.

---

## Phase 7: User Story 5 - End-to-End Testing with Playwright (Priority: P3)

**Goal**: Automate verification of canvas initialization, 60fps loop, and turn interactions using Playwright.

**Independent Test**: Run Playwright test suite, assert canvas element is rendered, verify option click interaction, and inspect captured screenshots.

### Implementation for User Story 5

- [x] T022 [US5] Implement Playwright E2E test in `apps/web/tests/e2e/phaser-game-arena.spec.ts` testing `/lessons/[slug]/game_v2` canvas presence, WebGL context, and question option selection
- [x] T023 [US5] Add canvas screenshot capture and assertion in `apps/web/tests/e2e/phaser-game-arena.spec.ts` for visual regression reporting

**Checkpoint**: Automated E2E verification in place.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Quality gates, static analysis, and verification.

- [x] T024 [P] Run type-check via `npm run type-check` in `apps/web` and verify 0 TypeScript compiler errors
- [x] T025 Run `quickstart.md` manual checklist verifying canvas mounting, combat, audio, and clean unmount without memory warnings

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1 (Setup)**: No dependencies — starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 — BLOCKS all User Stories.
- **Phase 3 (User Story 1 - MVP)**: Depends on Phase 2 — Delivers working arena on `/lessons/[slug]/game_v2`.
- **Phase 4 (User Story 2 - Combat Sync)**: Depends on Phase 3 (US1).
- **Phase 5 (User Story 3 - Visual Systems)**: Can run in parallel with or after Phase 4.
- **Phase 6 (User Story 4 - Audio System)**: Can run in parallel with Phase 4 & 5.
- **Phase 7 (User Story 5 - Playwright E2E)**: Depends on Phase 3 & 4.
- **Phase 8 (Polish)**: Final verification step.

### Parallel Opportunities
- `T002` and `T003` can run in parallel during Setup.
- `T005` and `T006` can run in parallel during Foundational.
- `T007` (CharacterEntity) can be built in parallel with foundational tasks.
- `T012` (ParticleSystem), `T016` (ParallaxSystem), `T017` (DialogueBubble), and `T019` (AudioSystem) are independent modules in separate files that can be implemented in parallel.

---

## Implementation Strategy

### MVP First (Phases 1-3)
1. Install `phaser` and configure types (Phase 1).
2. Build bridge bus and animation parser (Phase 2).
3. Build `CharacterEntity`, `BattleArenaScene`, `PhaserArena`, `GameContainerV2`, and route `/lessons/[slug]/game_v2` (Phase 3).
4. **VALIDATE MVP**: Open `http://localhost:3000/lessons/[slug]/game_v2` to confirm canvas renders at 60 FPS with animated characters and question card.

### Incremental Feature Delivery
1. Add turn combat synchronization & particles (Phase 4).
2. Add parallax environment, dialogue bubbles, and nametags (Phase 5).
3. Add adaptive stage music & audio mute controls (Phase 6).
4. Add Playwright E2E test suite (Phase 7).
5. Typecheck & final quality audit (Phase 8).
