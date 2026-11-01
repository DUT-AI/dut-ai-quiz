# Feature Specification: 2D Cartoon Browser Game Engine with Phaser in Lesson UI

**Feature Branch**: `013-phaser-lesson-game`

**Created**: 2026-11-01

**Status**: Draft

**Input**: User description: "Đối với game của mỗi lesson tôi muốn thay đổi UI bằng engine game thật. Tích hợp Phaser theo mô hình Canvas nhúng trực tiếp trong Next.js (apps/web). Chọn Phaser 4. Phần hiển thị markdown câu hỏi và text giữ nguyên, còn lại đổi toàn bộ bằng engine game thật. Sử dụng các asset có sẵn trong thư mục public/assets (shield-knight-FREE, faceless-void-reaper-FREE, infernal-spirits-FREE-v2, gegx-rpg-music-free-v1.0). Tạo ra game v2 với route riêng là /game_v2 để không làm ảnh hưởng đến game v1."

## User Scenarios & Testing

### User Story 1 - Real-time 2D Cartoon Battle Arena on Dedicated Route /game_v2 (Priority: P1)

As a learner studying a lesson, when I navigate to `/game_v2` (or `/lessons/[slug]/game_v2`), I want to see a brand new 2D cartoon battle arena rendered by a real game engine (Phaser 4) instead of legacy DOM elements, featuring smooth animated characters (Shield Knight as player, Void Reaper as boss/enemy), parallax scrolling background, and live camera framing, while keeping the existing `/game` route intact.

**Why this priority**: Core visual transformation requested by the user, isolated cleanly on `/game_v2` for zero-risk side-by-side rollout.

**Independent Test**: Navigate to `/game_v2?slug=[slug]` or `/lessons/[slug]/game_v2`, verify that the canvas initializes at 60 FPS, Shield Knight and Void Reaper sprites render with idle animations, and the background displays layered parallax art.

**Acceptance Scenarios**:
1. **Given** a learner opens `/game_v2` (or `/lessons/[slug]/game_v2`), **When** the page loads, **Then** the Phaser game canvas mounts without SSR errors, loads character textures from `public/assets/shield-knight-FREE` and `public/assets/faceless-void-reaper-FREE`, and runs idle animations smoothly.
2. **Given** the canvas is rendered, **When** the viewport resizes or enters fullscreen, **Then** Phaser Scale Manager maintains responsive aspect ratio and crisp pixel clarity.
3. **Given** a user navigates to the existing `/lessons/[slug]/game` route, **When** loaded, **Then** original Game v1 remains fully functional and untouched.

---

### User Story 2 - Event-Driven Gameplay Synchronization with Quiz Turns (Priority: P1)

As a learner answering quiz questions, when I choose an answer:
- If I choose correctly, my character (Shield Knight) plays a dynamic attack animation (`Valiant_Slash`), rushes/hits the enemy with particle burst effects, and the boss reacts (hurt flash, HP bar reduction).
- If I choose incorrectly or time out, the boss (Void Reaper) strikes with `Void_Strike`, camera shakes, my character receives damage, and HP decrements.
- Dialogue bubbles and floating damage text pop up in cartoon style to give instant feedback.

**Why this priority**: Connects React quiz logic (`useGameTurn`, `useGameSession`) to the Phaser Scene via a clean event bridge without polluting game logic with DOM code or vice versa.

**Independent Test**: Dispatch quiz state changes (`submitAnswer` correct/incorrect) and verify that corresponding Phaser events trigger matching sprite animations, camera effects (shake), and particle emitters.

**Acceptance Scenarios**:
1. **Given** a question is active, **When** the user clicks the correct option, **Then** the event bridge signals Phaser to play player slash animation, emit hit particles, play sound effects if enabled, and smoothly update the boss HP bar in-engine.
2. **Given** a question is active, **When** the timer expires or an incorrect option is chosen, **Then** the enemy triggers its attack animation, the screen shakes, and player damage indicators pop up.

---

### User Story 3 - Visual Systems: Parallax Environment, Floating Nametags & Dialogue Bubbles (Priority: P2)

As a player, I want the arena to have depth with layered parallax backgrounds, clear floating nametags above characters, and expressive cartoon dialogue bubbles (e.g. "Take that!", "Ouch!", "Critical Hit!") during interactions, so that the game feels alive and polished.

**Why this priority**: Fulfills the explicit visual requirements from the project specification for cartoon side-scrolling games.

**Independent Test**: Verify camera panning/offset creates multi-layer parallax motion, nametag containers track character positions continuously, and dialogue bubbles pop up on answer submission and fade out naturally.

**Acceptance Scenarios**:
1. **Given** characters are idling or moving, **When** camera shifts, **Then** foreground, midground, and background layers scroll at differentiated speeds (parallax depth).
2. **Given** a turn outcome occurs, **When** dialogue bubble triggers, **Then** a cartoon comic-style bubble appears anchored above the character's head with spring/tween animation and auto-dismisses.

---

### User Story 4 - Dynamic Adaptive Music & Audio Management (Priority: P2)

As a learner playing the lesson game, I want immersive RPG background music that dynamically adapts to each stage (e.g., Adventure/Forest for Stage 1, Cave/Foggy Moor for Stage 2, Abandoned Hall for Stage 3, and a triumphant Victory jingle on game win), with an intuitive Mute / Volume toggle, so that the game feels rich and atmospheric without being intrusive.

**Why this priority**: Fulfills the Audio Management architecture requirement using the newly provided RPG music asset collection (`gegx-rpg-music-free-v1.0`).

**Independent Test**: Mount the game canvas, unlock audio on user interaction, verify that stage music begins looping smoothly using intro/loop points from `loops.json`, transitions between stages, plays the victory jingle upon victory, and respects the mute/volume toggle.

**Acceptance Scenarios**:
1. **Given** a player enters the battle arena and interacts with the page, **When** audio unlocks, **Then** the stage-appropriate BGM starts playing with smooth intro-to-loop playback.
2. **Given** the stage changes or the game finishes with victory, **When** the state event arrives, **Then** previous music fades out and stage music or `victory.ogg` plays seamlessly.
3. **Given** the user toggles the Mute button, **When** muted, **Then** Phaser sound manager mutes all channels and persists preference in LocalStorage.

---

### User Story 5 - End-to-End Game Lifecycle & Testing with Playwright (Priority: P3)

As a developer and QA engineer, I want the Phaser-powered game container to be verified through automated Playwright tests and unit tests (Vitest), capturing screenshots of the canvas and verifying interaction flow, so that no regression occurs.

**Why this priority**: Ensures the constraint "Do not claim a feature is complete until it has been tested" is strictly met.

**Independent Test**: Run Playwright test suite to inspect canvas rendering, test option clicks, check screenshot artifacts, and verify turn state transitions.

**Acceptance Scenarios**:
1. **Given** the Playwright test suite runs against the game route, **When** the test executes, **Then** the canvas is present, non-blank, receives events, and passes automated assertions.

---

## Technical & Architecture Constraints

1. **Phaser Engine Version**: Phaser 4 (`phaser` latest / v4 compatible architecture).
2. **Primary Route**: `/lessons/[slug]/game_v2` (`apps/web/app/(root)/lessons/[slug]/game_v2/page.tsx`), maintaining complete isolation from the existing `/lessons/[slug]/game`.
3. **Strict Modular Architecture (Single Responsibility Principle)**:
   - **NO monolithic files**. Every distinct subsystem, entity, and component MUST be in its own dedicated file:
     - `phaser-arena.tsx`: React mounting & lifecycle wrapper.
     - `phaser-game-bridge.ts`: Independent event bus.
     - `battle-arena-scene.ts`: Orchestrates scene lifecycle.
     - `character-entity.ts`: Encapsulates character sprite, animations, and movement.
     - `dialogue-bubble.ts`: Encapsulates cartoon dialogue bubbles and nametags.
     - `animation-system.ts`: Loads & builds sprite animations from `ANIMATION-INDEX.json`.
     - `particle-system.ts`: Manages hit sparks, slash FX, and auras.
     - `parallax-system.ts`: Manages multi-layered background scrolling.
     - `audio-system.ts`: Manages BGM playback, loop metadata (`loops.json`), and mute state.
     - `use-phaser-bridge.ts`: Custom hook mediating React turn states to Phaser.
4. **Framework Integration**: Embedded HTML5 Canvas component in Next.js (`apps/web`), dynamic import with `ssr: false`, lifecycle cleanups (`game.destroy(true)`) to prevent memory leaks and duplicate canvas instances during Next.js Hot Module Replacement (HMR).
5. **Asset Pipeline**:
   - Player: `apps/web/public/assets/shield-knight-FREE` (frames parsed via `ANIMATION-INDEX.json` for Idle, Walk, Valiant_Slash in 8 directions).
   - Boss / Monster: `apps/web/public/assets/faceless-void-reaper-FREE` (frames parsed via `ANIMATION-INDEX.json` for Idle, Walk, Void_Strike in 8 directions).
   - Minions / Effects: `apps/web/public/assets/infernal-spirits-FREE-v2`.
   - Music & Audio: `apps/web/public/assets/gegx-rpg-music-free-v1.0` (loop points defined in `loops.json`, multi-stage BGM for forest, cave, misty lake, abandoned hall, and victory jingles).
   - No placeholder rectangles for character art.
6. **Separation of Concerns**:
   - React manages Question Markdown, options list, timer countdown numbers, and server session synchronization.
   - Phaser manages visual stage, character entities, animations, particle effects, health bar shaders/renderers, camera movements, and dialogue bubbles.
   - Communication between React and Phaser is mediated via a decoupled Event Bus / Bridge (`PhaserBridge`).
