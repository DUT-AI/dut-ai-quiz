# Quickstart & Verification Guide: Phaser 2D Cartoon Battle Arena

**Feature**: 2D Cartoon Browser Game Engine with Phaser in Lesson UI  
**Branch**: `013-phaser-lesson-game`  

## 1. Prerequisites & Installation

Ensure dependencies are installed in `apps/web`:
```bash
cd apps/web
npm install phaser
```

## 2. Running Local Dev Server

Start the web application:
```bash
npm run dev
```

Navigate to:
- Direct Game v2 Route: `http://localhost:3000/game_v2` (or with specific lesson `http://localhost:3000/game_v2?slug=[slug]`)
- Lesson Game v2 Route: `http://localhost:3000/lessons/[slug]/game_v2`
- (For comparison) Original Game v1: `http://localhost:3000/lessons/[slug]/game`

## 3. Manual Verification Checklist

- [ ] **Route Isolation**: Accessing `http://localhost:3000/lessons/[slug]/game` renders Game v1 as usual; accessing `/game_v2` renders Game v2.
- [ ] **Canvas Mounting**: Verify that the 2D cartoon battle arena canvas appears smoothly on `/game_v2`.
- [ ] **Character Rendering**:
  - Shield Knight displays on the left facing right with an animated Idle stance.
  - Void Reaper displays on the right facing left with an animated Idle stance.
  - Floating nametags are pinned above their heads.
- [ ] **Parallax Scrolling**: Background shows multiple distinct layers with subtle depth motion.
- [ ] **Turn Correct Interaction**:
  - Select the correct option in the React Question Card.
  - Knight performs `Valiant_Slash`, dashing forward with particle spark bursts.
  - Boss flashes red/hurt, its health bar visibly shrinks, and a cartoon dialogue bubble pops up ("Hit!").
- [ ] **Turn Incorrect / Timeout Interaction**:
  - Select an incorrect option or allow the timer to expire.
  - Boss triggers `Void_Strike`.
  - Camera shakes subtly (`cameras.main.shake`), Knight plays hurt reaction, and player HP updates.
- [ ] **Item Hotbar Synchronization**:
  - Using a shield or double damage item reflects a magical particle aura in the Phaser arena.
- [ ] **Adaptive Audio & Stage Music**:
  - Interacting with the arena starts stage BGM (e.g. `adventure_begins` / `forest`).
  - Advancing stages transitions music with smooth fade-out.
  - Toggling Mute button instantly silences/restores sound and persists across reloads.
  - Winning the match plays the `jingles/victory` fanfare.
- [ ] **Cleanup & Unmount**:
  - Navigating away from the Game tab immediately destroys the canvas and cleans up WebGL contexts with 0 console memory warnings.

## 4. Automated Testing (Playwright & Typecheck)

Run type checking:
```bash
npm run type-check
```

Run Playwright E2E tests:
```bash
npx playwright test tests/e2e/phaser-game-arena.spec.ts
```
