# Interface Contracts: Game Presentational Components

**Feature**: `004-refactor-game-container`
**Date**: 2026-10-24

These contracts define the component signatures for presentational UI modules extracted from `game-container.tsx`.

---

## 1. `GameTopBar`

Located at: `apps/web/features/game/components/game-top-bar.tsx`

```typescript
export interface GameTopBarProps {
  lessonSlug: string;
}
```

Renders:
- Back button navigating back to `/lessons/${lessonSlug}`.
- Dark/Light Theme toggle (`SwitchTheme`).

---

## 2. `GameHeaderHud`

Located at: `apps/web/features/game/components/game-header-hud.tsx`

```typescript
export interface GameHeaderHudProps {
  stageProgress: ("correct" | "incorrect" | "idle")[];
  currentIdx: number;
  score: number;
}
```

Renders:
- Left: "TIẾN TRÌNH THỬ THÁCH" indicator dots for each question in the tier with Swords (active), Trophy (correct), Skull (incorrect), and Lock (upcoming).
- Right: "ĐIỂM SỐ" with neon cyan PTS counter.

---

## 3. `GameAlertOverlay`

Located at: `apps/web/features/game/components/game-alert-overlay.tsx`

```typescript
export interface GameAlertOverlayProps {
  showBossWarning: boolean;
  onAnimationComplete: () => void;
}
```

Renders:
- Red warning banner animation overlay when transitioning to Boss battle mode.
