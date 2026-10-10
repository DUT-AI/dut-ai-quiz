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

export const GradingCriterionSchema = z.object({
  id: z.string(),
  criterion: z.string(),
  description: z.string(),
  weight: z.number(),
});

export const HomeworkRubricSchema = z.object({
  topic: z.string().optional(),
  objective: z.string().optional(),
  required_files: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  allowed_libraries: z.array(z.string()).default([]),
  forbidden_libraries: z.array(z.string()).default([]),
  notes: z.array(z.string()).default([]),
  criteria: z.array(GradingCriterionSchema).default([]),
});

export const HomeworkSchema = z.object({
  id: z.string().uuid(),
  lesson_id: z.string().uuid().nullable(),
  title: z.string(),
  description: z.string(),
  created_by: z.number(),
  created_at: z.string(),
  updated_at: z.string(),
  has_attachment: z.boolean(),
  submitted_count: z.number(),
  grading_status: z.string().default("PENDING"),
  grading_error: z.string().nullable().optional(),
  grading_rubric: HomeworkRubricSchema.nullable().optional(),
  current_submission: HomeworkSubmissionSchema.nullable().optional(),
});

export type Homework = z.infer<typeof HomeworkSchema>;
export type HomeworkSubmission = z.infer<typeof HomeworkSubmissionSchema>;
export type GradingCriterion = z.infer<typeof GradingCriterionSchema>;
export type HomeworkRubric = z.infer<typeof HomeworkRubricSchema>;

export interface HomeworkFormValues {
  lessonId: string;
  title: string;
  description: string;
  file?: File | null;
}
