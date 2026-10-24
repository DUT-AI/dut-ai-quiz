import type { Schema } from "@/types/api";

// Core Domain Types mapped directly from FastAPI OpenAPI Contract
export type GamificationStartIn = Schema<"GamificationStartIn">;
export type GamificationAnswerPatchIn = Schema<"GamificationAnswerPatchIn">;
export type GamificationUseItemIn = Schema<"GamificationUseItemIn">;
export type GamificationState = Schema<"GamificationStateOut">;
export type GameOption = Schema<"GameQuestionOptionOut">;

export type GameQuestion = Omit<Schema<"GameQuestionSnapshotOut">, "options"> & {
  options: GameOption[];
};

export type GameSnapshot = Omit<Schema<"GameSessionSnapshotOut">, "questions"> & {
  questions: GameQuestion[];
};

export type GamificationAnswerResult = Schema<"GamificationAnswerResultOut">;
export type GameLessonSummary = Schema<"GameLessonSummaryOut">;
export type GameLeaderboardRow = Schema<"GameLeaderboardRowOut">;
export type UserMatchHistoryItem = Schema<"UserMatchHistoryItem">;
export type UserMatchHistoryResponse = Schema<"UserMatchHistoryResponse">;

export interface StartGameSessionResponse {
  session_id: string;
  snapshot: GameSnapshot;
}

export interface GameSession {
  id: string;
  user_id: number;
  started_at: string;
  completed_at?: string | null;
  status: "IN_PROGRESS" | "COMPLETED";
  snapshot?: GameSnapshot | null;
  tags_filter: string[];
  question_limit: number;
}

// Shared Game UI & Hook types
export type ItemType = "50-50" | "freeze" | "double" | "shield";
export type BossStatus = "idle" | "attack" | "damage" | "defeat";
export type ScreenState = "start" | "playing" | "result";
export type GameResultState = "playing" | "victory" | "defeat";
export type StageProgressStatus = "correct" | "incorrect" | "idle";

export const getBossName = (stageNum: number): string => {
  if (stageNum === 1) return "SLIME CHÚA";
  if (stageNum === 2) return "MA BÀN THẠCH";
  return "MA NHÃN TỐI THƯỢNG";
};
