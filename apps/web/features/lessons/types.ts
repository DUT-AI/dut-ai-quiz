import { z } from "zod";

export const LessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  slug: z.string().nullable().optional(),
  content_md: z.string().nullable().optional(),
  module_id: z.string().nullable().optional(),
  has_game_questions: z.boolean().optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const RelatedLessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  slug: z.string().nullable(),
  score: z.number(),
  matched_chunk: z.string(),
});

export type RelatedLesson = z.infer<typeof RelatedLessonSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  lessons: z.array(LessonSchema).optional(),
});

export type Module = z.infer<typeof ModuleSchema>;
