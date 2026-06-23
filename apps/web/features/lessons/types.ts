import { z } from "zod";

export const LessonSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  order: z.number(),
});

export type Lesson = z.infer<typeof LessonSchema>;
