import { z } from "zod";

export const HomeworkSubmissionStatusSchema = z.enum([
  "UPLOADED",
  "GRADING",
  "GRADED",
  "FAILED",
]);

export const HomeworkSubmissionSchema = z.object({
  id: z.string().uuid(),
  homework_id: z.string().uuid(),
  user_id: z.number(),
  original_filename: z.string(),
  submitted_at: z.string(),
  is_late: z.boolean(),
  attempt_number: z.number(),
  status: HomeworkSubmissionStatusSchema,
  is_pass: z.boolean().nullable().optional(),
  score: z.number().nullable().optional(),
  feedback: z.string().nullable().optional(),
  score_details: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  plagiarism_info: z.array(z.record(z.string(), z.unknown())).nullable().optional(),
  is_plagiarized: z.boolean(),
  plagiarized_from_user_id: z.number().nullable().optional(),
  grading_error: z.string().nullable().optional(),
  owner_name: z.string().nullable().optional(),
  owner_avatar_url: z.string().nullable().optional(),
});

export const HomeworkSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string(),
  deadline: z.string(),
  created_by: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  has_attachment: z.boolean(),
  submitted_count: z.number(),
  current_submission: HomeworkSubmissionSchema.nullable().optional(),
});

export type Homework = z.infer<typeof HomeworkSchema>;
export type HomeworkSubmission = z.infer<typeof HomeworkSubmissionSchema>;

export interface HomeworkFormValues {
  lessonId: string;
  title: string;
  description: string;
  deadline: string;
  file?: File | null;
}
