import { z } from "zod";

export const LessonVideoSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  title: z.string().min(1, "Tiêu đề video không được để trống"),
  url: z.string().min(1, "URL không hợp lệ"),
  youtube_video_id: z.string(),
  start_seconds: z.number().default(0),
  order: z.number().default(0),
  description: z.string().optional().default(""),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type LessonVideo = z.infer<typeof LessonVideoSchema>;

export const LessonVideoInputSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1, "Tiêu đề video không được để trống"),
  url: z.string().min(1, "Vui lòng nhập đường link YouTube"),
  description: z.string().optional(),
  order: z.number().optional(),
});

export type LessonVideoInput = z.infer<typeof LessonVideoInputSchema>;

export const LessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  slug: z.string().nullable().optional(),
  content_md: z.string().nullable().optional(),
  module_id: z.string().nullable().optional(),
  has_game_questions: z.boolean().optional(),
  videos: z.array(LessonVideoSchema).optional().default([]),
});

export type Lesson = z.infer<typeof LessonSchema>;

export const LessonEditorSchema = LessonSchema.omit({ id: true, videos: true }).extend({
  content_md: z.string().optional(),
  videos: z.array(LessonVideoInputSchema).optional(),
});

export type LessonEditorInput = z.infer<typeof LessonEditorSchema>;

export const RelatedLessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  slug: z.string().nullable(),
  score: z.number(),
  matched_chunk: z.string(),
});

export type RelatedLesson = z.infer<typeof RelatedLessonSchema>;

export const RelativeDocumentSchema = z.object({
  document_title: z.string(),
  full_md: z.string(),
  relative_chunk: z.array(z.string()),
});

export type RelativeDocument = z.infer<typeof RelativeDocumentSchema>;

export const ModuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  lessons: z.array(LessonSchema).optional(),
});

export type Module = z.infer<typeof ModuleSchema>;
