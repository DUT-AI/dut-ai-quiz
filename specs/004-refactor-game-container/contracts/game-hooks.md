# Interface Contracts: Game Hooks

**Feature**: `004-refactor-game-container`
**Date**: 2026-10-24

These contracts define the exact interfaces between the extracted React custom hooks and the orchestrator component `GameContainer`.

---

## 1. `useGameSession` Contract

Located at: `apps/web/features/game/hooks/use-game-session.ts`

```typescript
import { GameQuestion, GamificationState, StartGameSessionResponse } from "../types";

export interface UseGameSessionProps {
  lessonSlug: string;
  initialSession: StartGameSessionResponse | null;
}

export interface UseGameSessionResult {
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
  
  // State controllers
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
  
  // Actions
  handleRetry: () => void;
  initializeGame: (data: StartGameSessionResponse) => void;
}
```

---

## 2. `useGameTimer` Contract

Located at: `apps/web/features/game/hooks/use-game-timer.ts`

```typescript
import { GameQuestion } from "../types";

export interface UseGameTimerProps {
  currentQuestion: GameQuestion | null;
  currentIdx: number;
  isAnswered: boolean;
  onTimeOut: () => void;
}

export interface UseGameTimerResult {
  timeLeftRef: React.MutableRefObject<number>;
  timerFrozen: boolean;
  setTimerFrozen: (frozen: boolean) => void;
  timerMax: number;
  freezeTimerFor30Seconds: () => void;
}
```

---

## 3. `useGameItems` Contract

Located at: `apps/web/features/game/hooks/use-game-items.ts`

```typescript
import { GameQuestion, GamificationState } from "../types";
import { ItemType } from "../components/item-hotbar";

export interface UseGameItemsProps {
  sessionId: string | null;
  currentQuestion: GameQuestion | null;
  gold: number;
  stage: number;
  gamification: GamificationState | null;
  isAnswered: boolean;
  gameResult: string;
  showBossWarning: boolean;
  onFreezeTimer: () => void;
  onDeductGold: (amount: number) => void;
}

export interface UseGameItemsResult {
  hiddenOptions: string[];
  shieldActive: boolean;
  doubleActive: boolean;
  handleUseItem: (type: ItemType) => void;
  resetItemBuffs: () => void;
}
```

---

## 4. `useGameTurn` Contract

Located at: `apps/web/features/game/hooks/use-game-turn.ts`

```typescript
import { GameQuestion, GamificationState } from "../types";

export interface UseGameTurnProps {
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
  // Updaters
  setHp: React.Dispatch<React.SetStateAction<number>>;
  setBossHp: React.Dispatch<React.SetStateAction<number>>;
  setScore: React.Dispatch<React.SetStateAction<number>>;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setStageProgress: React.Dispatch<React.SetStateAction<("correct" | "incorrect" | "idle")[]>>;
  setCurrentIdx: React.Dispatch<React.SetStateAction<number>>;
  setGamification: React.Dispatch<React.SetStateAction<GamificationState | null>>;
}

export interface UseGameTurnResult {
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
