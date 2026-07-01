import { z } from "zod";

export const LessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
  slug: z.string().nullable().optional(),
  content_md: z.string().nullable().optional(),
});

export type Lesson = z.infer<typeof LessonSchema>;
