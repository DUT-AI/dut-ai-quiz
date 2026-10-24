# Phase 1: Data Model & State Architecture

**Feature**: `004-refactor-game-container`
**Date**: 2026-10-24

---

## 1. State Machine & Transitions

The game experience follows a strict 3-stage screen lifecycle:

```
[Start Screen: "start"] ──(session initialized)──> [Playing Screen: "playing"] ──(lives <= 0 OR questions finished)──> [Result Screen: "result"]
                                                              ▲                                                               │
                                                              └──────────────────(Retry Clicked)──────────────────────────────┘
```

### Screen States
- `start`: Initial session creation or loading active session. Displays loading spinner.
- `playing`: Main arena battle, HUD, item hotbar, timer, and question card active.
- `result`: Game finished (Victory if all tiers cleared, Defeat if HP <= 0). Shows points, coins, and retry button.

### Turn / Combat Status State Machine
For each question:
```
[idle] ──(player submits answer / timeout)──> [player attack / damage] ──(timeout / animation finish)──> [next question / defeat]
```
- `idle`: Awaiting user input or timer tick.
- `attack`: Player answered correctly; player attacks, boss takes damage.
- `damage`: Player answered incorrectly or timed out; boss attacks, player takes damage.
- `defeat`: Boss HP reached 0 in current tier.

---

## 2. Hook Data Models & Signatures

### 2.1 `useGameSession`
Manages session creation, resume, rehydration, and retry.
```typescript
interface UseGameSessionOptions {
  lessonSlug: string;
  initialSession: StartGameSessionResponse | null;
}

interface UseGameSessionReturn {
  sessionId: string | null;
  questions: GameQuestion[];
  gamification: GamificationState | null;
  screen: "start" | "playing" | "result";
  isInitializing: boolean;
  gameResult: "playing" | "victory" | "defeat";
  currentIdx: number;
  stage: number;
  hp: number;
  bossHp: number;
  bossMaxHp: number;
  score: number;
  gold: number;
  stageProgress: ("correct" | "incorrect" | "idle")[];
  showBossWarning: boolean;
  isBossMode: boolean;
  setScreen: (screen: "start" | "playing" | "result") => void;
  setGameResult: (result: "playing" | "victory" | "defeat") => void;
  setHp: React.Dispatch<React.SetStateAction<number>>;
  setBossHp: React.Dispatch<React.SetStateAction<number>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setStageProgress: React.Dispatch<React.SetStateAction<("correct" | "incorrect" | "idle")[]>>;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setStage: React.Dispatch<React.SetStateAction<number>>;
  setShowBossWarning: React.Dispatch<React.SetStateAction<boolean>>;
  handleRetry: () => void;
  initializeGame: (data: StartGameSessionResponse) => void;
}
```

### 2.2 `useGameTimer`
Manages high-performance countdown, time freezing, and timeout handling.
```typescript
interface UseGameTimerOptions {
  currentQuestion: GameQuestion | null;
  currentIdx: number;
  isAnswered: boolean;
  onTimeOut: () => void;
}

interface UseGameTimerReturn {
  timeLeftRef: React.MutableRefObject<number>;
  timerFrozen: boolean;
  setTimerFrozen: (frozen: boolean) => void;
  timerMax: number;
  resetTimer: (newMax: number) => void;
}
```

### 2.3 `useGameItems`
Manages purchase, activation, and effects of 4 item types.
```typescript
interface UseGameItemsOptions {
  sessionId: string | null;
  currentQuestion: GameQuestion | null;
  gold: number;
  stage: number;
  gamification: GamificationState | null;
  isAnswered: boolean;
  gameResult: string;
  showBossWarning: boolean;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setTimerFrozen: (frozen: boolean) => void;
}

interface UseGameItemsReturn {
  hiddenOptions: string[];
  setHiddenOptions: (options: string[]) => void;
  shieldActive: boolean;
  setShieldActive: (active: boolean) => void;
  doubleActive: boolean;
  setDoubleActive: (active: boolean) => void;
  handleUseItem: (type: ItemType) => void;
  resetItemBuffs: () => void;
}
```

### 2.4 `useGameTurn`
Manages answer selection, scoring calculations, combat animation synchronization, and moving to next question.
```typescript
interface UseGameTurnOptions {
  sessionId: string | null;
  currentQuestion: GameQuestion | null;
  currentIdx: number;
  totalQuestions: number;
  stage: number;
  hp: number;
  bossHp: number;
  bossMaxHp: number;
  gold: number;
  score: number;
  shieldActive: boolean;
  doubleActive: boolean;
  timeLeftRef: React.MutableRefObject<number>;
  onDamageTaken: () => void;
  onGameOver: (result: "victory" | "defeat") => void;
  onNextStage: (nextStage: number) => void;
  resetTurnBuffs: () => void;
  // State setters
  setHp: React.Dispatch<React.SetStateAction<number>>;
  setBossHp: React.Dispatch<React.SetStateAction<number>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setStageProgress: React.Dispatch<React.SetStateAction<("correct" | "incorrect" | "idle")[]>>;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
}

interface UseGameTurnReturn {
  selectedOptionId: string | null;
  isAnswered: boolean;
  isSelectedCorrect: boolean;
  correctOptionId: string | null;
  bossStatus: "idle" | "attack" | "damage" | "defeat";
  submitAnswer: (optionId: string) => void;
  handleTimeOut: () => void;
  nextQuestion: () => void;
}
```

---

## 3. Component Prop Contracts

### 3.1 `GameTopBar`
```typescript
interface GameTopBarProps {
  lessonSlug: string;
}
```

### 3.2 `GameHeaderHud`
```typescript
interface GameHeaderHudProps {
  stageProgress: ("correct" | "incorrect" | "idle")[];
  currentIdx: number;
  score: number;
}
```

### 3.3 `GameAlertOverlay`
```typescript
interface GameAlertOverlayProps {
  showBossWarning: boolean;
  onBossWarningComplete: () => void;
}
```
