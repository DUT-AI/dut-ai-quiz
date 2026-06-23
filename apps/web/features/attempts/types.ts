import { z } from "zod";

export const QuizOptionSchema = z.object({
  id: z.string(),
  text: z.string(),
});

export type QuizOption = z.infer<typeof QuizOptionSchema>;

export const QuizQuestionSchema = z.object({
  question_id: z.string(),
  content: z.string(),
  options: z.array(QuizOptionSchema),
  userSelectedOptionId: z.string().nullable().optional(),
});

export type QuizQuestion = z.infer<typeof QuizQuestionSchema>;

export const StartAttemptResponseSchema = z.object({
  attempt_id: z.string(),
  expires_at: z.string(),
  tab_out_count: z.number(),
  questions: z.array(
    z.object({
      question_id: z.string(),
      content: z.string(),
      options: z.array(QuizOptionSchema),
      difficulty: z.string(),
      tags: z.array(z.string()),
    })
  ),
});

export type StartAttemptResponse = z.infer<typeof StartAttemptResponseSchema>;

export const AttemptOutSchema = z.object({
  id: z.string(),
  exam_id: z.string(),
  user_id: z.number(),
  started_at: z.string(),
  completed_at: z.string().nullable(),
  expires_at: z.string(),
  score: z.number().nullable(),
  status: z.string(),
  tab_out_count: z.number(),
});

export type AttemptOut = z.infer<typeof AttemptOutSchema>;

export const AttemptReviewResponseSchema = z.object({
  attempt: AttemptOutSchema,
  answers: z.array(
    z.object({
      question_id: z.string(),
      selected_option_id: z.string().nullable(),
    })
  ),
  questions: z.array(
    z.object({
      id: z.string(),
      content: z.string(),
      options: z.array(
        z.object({
          id: z.string(),
          text: z.string(),
          is_correct: z.union([z.boolean(), z.string(), z.number()]),
        })
      ),
      solution: z.string().nullable().optional(),
    })
  ),
});

export type AttemptReviewResponse = z.infer<typeof AttemptReviewResponseSchema>;

export const AttemptHistoryItemSchema = z.object({
  exam_title: z.string(),
  attempt: z.object({
    id: z.string(),
    exam_id: z.string(),
    started_at: z.string(),
    completed_at: z.string().nullable(),
    score: z.number().nullable(),
    status: z.string(),
    tab_out_count: z.number(),
    expires_at: z.string(),
  }),
});

export type AttemptHistoryItem = z.infer<typeof AttemptHistoryItemSchema>;

export const PracticeModeSchema = z.enum(["practice", "test", "study"]);
export type PracticeMode = z.infer<typeof PracticeModeSchema>;

export const PracticeSnapshotItemSchema = z.object({
  question_id: z.string(),
  content: z.string(),
  options: z.array(QuizOptionSchema),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

export type PracticeSnapshotItem = z.infer<typeof PracticeSnapshotItemSchema>;

export const PracticeSnapshotSchema = z.object({
  session_id: z.string(),
  presentation: z.array(PracticeSnapshotItemSchema),
  current_index: z.number(),
});

export type PracticeSnapshot = z.infer<typeof PracticeSnapshotSchema>;
