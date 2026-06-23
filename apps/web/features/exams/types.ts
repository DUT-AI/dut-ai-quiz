import { z } from "zod";

export const ExamOutSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  start_time: z.string().nullable(),
  end_time: z.string().nullable(),
  duration_minutes: z.number(),
  max_attempts: z.number(),
  is_published: z.boolean(),
  created_by: z.number(),
  participant_ids: z.array(z.number()),
});

export type ExamOut = z.infer<typeof ExamOutSchema>;

export const ExamTileSchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string(),
});

export type ExamTile = z.infer<typeof ExamTileSchema>;

export const ExamCreateSchema = z.object({
  title: z.string(),
  description: z.string(),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  duration_minutes: z.number().optional(),
  max_attempts: z.number().optional(),
  is_published: z.boolean().optional(),
  participant_ids: z.array(z.number()).optional(),
});

export type ExamCreate = z.infer<typeof ExamCreateSchema>;

export const LeaderboardEntrySchema = z.object({
  user_id: z.number(),
  username: z.string(),
  score: z.number(),
  best_score: z.number(),
  completed_at: z.string(),
});

export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const ExamStatsSchema = z.object({
  summary: z.object({
    total_assigned: z.number(),
    total_started: z.number(),
    total_completed: z.number(),
    average_score: z.number(),
    max_score: z.number(),
  }),
  score_distribution: z.array(
    z.object({
      range: z.string(),
      count: z.number(),
    })
  ),
  participants: z.array(
    z.object({
      user_id: z.number(),
      attempts_count: z.number(),
      best_score: z.number().nullable(),
      max_tab_out: z.number(),
    })
  ),
  question_stats: z.array(
    z.object({
      question_id: z.string(),
      content: z.string(),
      correct_rate: z.number(),
    })
  ),
});

export type ExamStats = z.infer<typeof ExamStatsSchema>;

export const ExternalTeamSchema = z.object({
  id: z.number(),
  team_name: z.string(),
  member_count: z.number(),
  members: z.array(
    z.object({
      user_id: z.number(),
      username: z.string(),
    })
  ),
});

export type ExternalTeam = z.infer<typeof ExternalTeamSchema>;

export const ExternalUserSchema = z.object({
  id: z.number(),
  username: z.string(),
  name: z.string(),
  email: z.string(),
  avatar_url: z.string().nullable().optional(),
});

export type ExternalUser = z.infer<typeof ExternalUserSchema>;
