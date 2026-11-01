# Technical Research & Architectural Decisions

**Feature**: 2D Cartoon Browser Game Engine with Phaser in Lesson UI  
**Branch**: `013-phaser-lesson-game`  
**Date**: 2026-11-01  

## 1. Phaser 4 Next.js Integration Architecture

### Context
Next.js 14 App Router executes components on both server and client. Phaser engine requires `window`, `document`, and WebGL/Canvas APIs that do not exist during SSR. Additionally, React 18 strict mode and Fast Refresh can mount and unmount components twice during development, which risks creating orphaned WebGL contexts and canvas memory leaks.

### Decision
Implement a dedicated client component wrapper `PhaserArena` that:
1. Dynamically loads the Phaser game initialization logic purely on the client using `useEffect` or `next/dynamic` with `{ ssr: false }`.
2. Stores the `Phaser.Game` instance in a React `useRef` (not `useState`) to prevent unnecessary re-renders.
3. Automatically tears down the game on unmount via `game.destroy(true, false)` (destroying plugins, canvas, and WebGL contexts cleanly).

### Rationale
- Completely avoids `window is not defined` errors.
- Prevents GPU context loss and duplicate canvas instances during Next.js Hot Module Replacement (HMR).

### Alternatives Considered
- **Iframe isolation**: Embedding an isolated Vite SPA via `<iframe>`. Rejected because communication via `postMessage` creates serializing latency, styling friction, and auth/theme sync overhead compared to native embedded canvas.
- **Rive / CSS DOM Animations**: Rejected because user explicitly specified Phaser game engine with side-scrolling, camera, and particle systems.

---

## 2. Asset Pipeline & Animation Controller

### Context
The project contains pre-existing character assets in `apps/web/public/assets/`:
- `shield-knight-FREE/`: Has `ANIMATION-INDEX.json` and 8-directional frames (`east`, `west`, `north`, `south`, `north-east`, etc.) for `Idle` (13 frames), `Walk` (12 frames), and `Valiant_Slash` (16 frames).
- `faceless-void-reaper-FREE/`: Has `ANIMATION-INDEX.json` and 8-directional frames for `Idle` (12 frames), `Walk` (12 frames), and `Void_Strike` (16 frames).
- `infernal-spirits-FREE-v2/`: Contains skill art, projectiles, and particle sprites.

### Decision
Implement a `CartoonAnimationController` within the Phaser Scene:
1. **Preload Phase**: Load character frame textures dynamically based on `ANIMATION-INDEX.json` format (`frame_000.png` to `frame_0XX.png`) or compile them into Phaser animation caches.
2. **Animation Generation**: Register animations with standard keys:
   - Player: `player_idle`, `player_walk`, `player_attack` (using `Valiant_Slash`).
   - Boss: `boss_idle`, `boss_walk`, `boss_attack` (using `Void_Strike`).
3. **Facing Direction**: Default player faces east (right) towards enemy; boss faces west (left) towards player. Flip sprites horizontally or pick directional subfolders (`east` / `west`).

### Rationale
- Reuses the rich existing assets directly in `public/assets`.
- Guarantees 0 placeholder rectangles, satisfying the core constraint.

### Alternatives Considered
- **Runtime Spritesheet packing (TexturePacker on the fly)**: Too slow on initial load. Direct frame loading via Phaser's `load.image` with animation sequence generation is fast, modular, and works out-of-the-box.

---

## 3. Event-Driven Bridge Pattern (React <-> Phaser)

### Context
The user specified that the Question Markdown, options, and text should remain in React, while the arena, boss HUD, and combat animations move to Phaser. React holds session authority (`useGameTurn`, `useGameSession`). Phaser must not reach into React state, and React must not manipulate Phaser canvas pixels directly.

### Decision
Build a bidirectional `PhaserGameBridge`:
- **React -> Phaser Events**:
  - `TURN_START(questionIndex, stage)`: Resets character positions to battle stances.
  - `ANSWER_CORRECT(damage, buffs)`: Triggers player approach, `Valiant_Slash` animation, particle burst, boss hurt flash, and boss HP decrement animation.
  - `ANSWER_INCORRECT(damage)`: Triggers boss `Void_Strike`, camera shake, player hurt flash, and player HP decrement animation.
  - `TIMEOUT`: Triggers boss counter-attack and alert speech bubble.
  - `ITEM_USED(itemId)`: Emits shield or double damage aura particles around player.
  - `GAME_OVER(result)`: Plays victory cheer or defeat fall.
- **Phaser -> React Events**:
  - `SCENE_READY`: Informs React that Phaser is ready to receive commands and initial stats.
  - `ANIMATION_COMPLETE(type)`: Signals React when turn combat animation finishes so the turn can transition smoothly to the next question.

### Rationale
- Complies strictly with Constitution Principle V (Authority & State Separation).
- React keeps full authority over score, timers, and questions. Phaser purely acts as a visual presentation engine.

---

## 4. Environment, Parallax, and Visual Systems

### Context
Requirements include:
- Colorful cartoon art style.
- Side-scrolling environment with layered parallax scrolling.
- Name tags above characters.
- Cartoon dialogue bubbles.
- Particle effects.

### Decision
1. **Parallax Background**:
   - 3 Layers: Sky/Distant Mountains (scroll factor 0.1), Midground Trees/Castle ruins (scroll factor 0.4), Foreground Arena Ground (scroll factor 1.0).
   - Animated idle camera sway or slight pan to simulate lively side-scrolling depth.
2. **Cartoon Dialogue Bubbles & Name Tags**:
   - Name tags: BitmapText or styled Phaser Text anchored to character containers (`character.container.add(nameTag)`), with dark outline and badge styling.
   - Dialogue bubbles: Dynamic 9-slice or graphics bubble with comic font, popping up with tween scale (`Phaser.Tweens`), holding for 1.2s, and fading out on attack/turn results.
3. **Particle Effects**:
   - Particle emitters for sparks, blood/void motes on slash impact, and magical shield auras when items are activated.

---

## 5. Playwright & Vitest Testing Strategy

### Decision
1. **Vitest**: Unit test the `PhaserGameBridge` event emitter and animation frame mapper functions.
2. **Playwright E2E**:
   - Navigate to `/lessons/[slug]` game tab.
   - Wait for `<canvas>` element to be rendered and active.
   - Assert canvas dimensions and WebGL context.
   - Interact with React question options and assert that canvas continues rendering at 60 FPS without throwing uncaught errors.
   - Take snapshot screenshots for visual regression verification.

---

## 6. Audio Management & Adaptive Stage Music

### Context
User added `apps/web/public/assets/gegx-rpg-music-free-v1.0/`, which contains structured RPG music with `loops.json`:
- Themes: `title_theme`, `adventure_begins`, `forest`, `cave`, `snowy_peaks`, `misty_lake`, `foggy_moor`, `abandoned_hall`, `chapel_vigil`.
- Jingles: `jingles/victory`.
- Audio formats provided: `.ogg` (highly compressed, optimal for web browsers) and `.wav` (fallback).
- Each track has `intro`, `loop`, and `outro` audio clips, with exact sample-level loop metadata in `loops.json`.

### Decision
Implement an `AudioSystem` inside Phaser:
1. **Format Preference**: Prioritize `.ogg` files for fast loading and reduced bandwidth consumption, falling back to `.wav` if needed.
2. **Autoplay Compliance**: Listen for Phaser's `sound.on('unlocked')` event or first user touch/click. Never trigger un-muted audio before user interaction to adhere to strict browser autoplay policies.
3. **Stage Theme Mapping**:
   - Stage 1 (Slime / Beginner): `adventure_begins` or `forest`
   - Stage 2 (Golem / Intermediate): `cave` or `foggy_moor`
   - Stage 3 (Reaper / Boss): `abandoned_hall` or `chapel_vigil`
   - Game Win / Victory: `jingles/victory`
4. **Seamless Looping & Fading**:
   - On stage transition, perform a gentle 800ms volume fade-out (`scene.tweens.add({ targets: currentMusic, volume: 0, duration: 800 })`) before starting the new track.
   - Chain `intro` -> `loop` automatically or play seamless `loop` with `loop: true`.
5. **Mute & Volume Control**:
   - Expose mute and volume states through the `PhaserGameBridge` so players can toggle sound directly from the HUD.
   - Persist mute preference in `localStorage.getItem('game_audio_muted')`.

### Rationale
- Creates an authentic RPG atmosphere that keeps learners engaged.
- Complies with modern web browser audio autoplay rules.
- Fully utilizes the newly provided music package and its `loops.json` definitions.

---

## 7. Isolated Route Architecture (`/game_v2`)

### Context
The user requested a dedicated route `/game_v2` for Game v2. The existing system has an active `/lessons/[slug]/game` route powering the current Game v1.

### Decision
1. **Parallel Component Structure**:
   - Game v1: Retain `GameContainer` (`game-container.tsx`) unchanged.
   - Game v2: Introduce `GameContainerV2` (`game-container-v2.tsx`), which replaces `BossHud` with `PhaserArena` while reusing the proven hooks (`useGameSession`, `useGameTurn`, `useGameTimer`, `useGameItems`) and UI elements (`GameQuestionCard`, `GameTopBar`, `ItemHotbar`).
2. **Dual Route Availability**:
   - Primary Route: `apps/web/app/(root)/game_v2/page.tsx` accessible directly at `/game_v2` (accepting an optional `?slug=...` query param).
   - Nested Route: `apps/web/app/(root)/lessons/[slug]/game_v2/page.tsx` accessible at `/lessons/[slug]/game_v2`.
3. **Zero Impact on Production**:
   - Existing lesson links and users accessing `/lessons/[slug]/game` continue using Game v1 with zero disruption.
   - Developers and testers can freely iterate on Game v2 at `/game_v2`.


