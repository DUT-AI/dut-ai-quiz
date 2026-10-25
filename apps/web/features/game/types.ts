import type { Schema } from "@/types/api";

// Core Domain Types mapped directly from FastAPI OpenAPI Contract
export type GamificationStartIn = Schema<"GamificationStartIn">;
export type GamificationAnswerPatchIn = Schema<"GamificationAnswerPatchIn">;
export type GamificationUseItemIn = Schema<"GamificationUseItemIn">;
export type GamificationState = Schema<"GamificationStateOut">;
export type GameOption = Schema<"GameQuestionOptionOut">;

export type GameQuestion = Schema<"GameQuestionSnapshotOut">;
export type GamificationAnswerResult = Schema<"GamificationAnswerResultOut">;
export interface GamificationUseItemResult {
  item_name: string;
  eliminated_option_ids: string[];
  time_freeze_active: boolean;
  updated_gamification: GamificationState;
}
export type GameLessonSummary = Schema<"GameLessonSummaryOut">;
export type GameLeaderboardRow = Schema<"GameLeaderboardRowOut">;
export type UserMatchHistoryItem = Schema<"UserMatchHistoryItem">;
export type UserMatchHistoryResponse = Schema<"UserMatchHistoryResponse">;

export type GameSession = Schema<"GameSessionOut">;

export type GameSessionReviewItem = Schema<"GameSessionReviewItemOut">;
export type GameSessionReview = Schema<"GameSessionReviewOut">;

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
