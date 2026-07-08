import { z } from "zod";

export const GamificationStartInSchema = z.object({
  lesson_slug: z.string(),
});
export type GamificationStartIn = z.infer<typeof GamificationStartInSchema>;

export const GamificationAnswerPatchInSchema = z.object({
  question_id: z.string(),
  option_id: z.string(),
  time_response: z.number(),
  activate_shield: z.boolean().default(false),
  activate_double_points: z.boolean().default(false),
});
export type GamificationAnswerPatchIn = z.infer<typeof GamificationAnswerPatchInSchema>;

export const GamificationUseItemInSchema = z.object({
  item_name: z.string(),
  question_id: z.string(),
});
export type GamificationUseItemIn = z.infer<typeof GamificationUseItemInSchema>;

export const GamificationStateSchema = z.object({
  lives: z.number(),
  gold: z.number(),
  points: z.number(),
  current_tier: z.number(),
  last_question_index: z.number(),
  boss_hp: z.number(),
  shield_used_in_tier: z.record(z.string(), z.boolean()),
  current_question_started_at: z.string(),
  total_time_response: z.number().optional(),
  final_score: z.number().optional(),
  attempt_count: z.number().optional(),
});
export type GamificationState = z.infer<typeof GamificationStateSchema>;

export const GamificationAnswerResultOutSchema = z.object({
  is_correct: z.boolean(),
  points_gained: z.number(),
  coins_gained: z.number(),
  updated_gamification: GamificationStateSchema,
  is_game_over: z.boolean(),
});
export type GamificationAnswerResultOut = z.infer<typeof GamificationAnswerResultOutSchema>;

export const GameLessonSummaryOutSchema = z.object({
  lesson_slug: z.string(),
  total_sessions: z.number(),
  completed_sessions: z.number(),
  highest_points: z.number(),
  total_gold_earned: z.number(),
  highest_tier: z.number(),
});
export type GameLessonSummaryOut = z.infer<typeof GameLessonSummaryOutSchema>;

export const GameLeaderboardRowOutSchema = z.object({
  user_id: z.number(),
  username: z.string().nullable().optional(),
  avatar_url: z.string().nullable().optional(),
  final_score: z.number(),
  gold: z.number(),
  total_time_response: z.number(),
  attempt_count: z.number(),
});
export type GameLeaderboardRowOut = z.infer<typeof GameLeaderboardRowOutSchema>;

// Game session entity structure
export const GameOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});
export type GameOption = z.infer<typeof GameOptionSchema>;

export const GameQuestionSchema = z.object({
  id: z.string(),
  content: z.string(),
  options: z.array(GameOptionSchema),
  time_limit: z.number(),
  time_response: z.number(),
  tier: z.number(),
  is_boss: z.boolean(),
});
export type GameQuestion = z.infer<typeof GameQuestionSchema>;

export const GameSnapshotSchema = z.object({
  lesson_slug: z.string(),
  questions: z.array(GameQuestionSchema),
  answers: z.record(z.string(), z.string()),
  gamification: GamificationStateSchema,
});
export type GameSnapshot = z.infer<typeof GameSnapshotSchema>;

export const GameSessionSchema = z.object({
  id: z.string(),
  user_id: z.number(),
  started_at: z.string(),
  completed_at: z.string().nullable().optional(),
  status: z.enum(["IN_PROGRESS", "COMPLETED"]),
  snapshot: GameSnapshotSchema.nullable().optional(),
  tags_filter: z.array(z.string()),
  question_limit: z.number(),
});
export type GameSession = z.infer<typeof GameSessionSchema>;

export const StartGameSessionResponseSchema = z.object({
  session_id: z.string(),
  snapshot: GameSnapshotSchema,
});
export type StartGameSessionResponse = z.infer<typeof StartGameSessionResponseSchema>;
