import { z } from "zod";

export const PoolTypeSchema = z.enum(["PRACTICE", "EXAM"]);
export type PoolType = z.infer<typeof PoolTypeSchema>;

export const QuestionCreateSchema = z.object({
  content: z.string(),
  options: z.array(z.any()),
  difficulty: z.string().optional(),
  tags: z.array(z.string()).optional(),
  lesson_id: z.string().nullable().optional(),
  pool_type: PoolTypeSchema.optional(),
  solution: z.string().optional(),
  created_by: z.number().optional(),
});

export type QuestionCreate = z.infer<typeof QuestionCreateSchema>;

export const QuestionOutSchema = z.object({
  id: z.string(),
  content: z.string(),
  options: z.array(z.any()),
  difficulty: z.string().optional(),
  tags: z.array(z.string()),
  lesson_id: z.string().optional(),
  pool_type: PoolTypeSchema.optional(),
  solution: z.string().nullable().optional(),
  created_by: z.number(),
});

export type QuestionOut = z.infer<typeof QuestionOutSchema>;

export const ParsedQuestionPreviewSchema = z.object({
  content: z.string(),
  options: z.array(
    z.object({
      text: z.string(),
      is_correct: z.boolean(),
      id: z.string().optional(),
      fixed: z.boolean().optional(),
    })
  ),
  solution: z.string().nullable(),
  confidence: z.number(),
});

export type ParsedQuestionPreview = z.infer<typeof ParsedQuestionPreviewSchema>;

export const PDFParseResponseSchema = z.object({
  questions: z.array(ParsedQuestionPreviewSchema),
  total_pages: z.number(),
  warnings: z.array(z.string()),
});

export type PDFParseResponse = z.infer<typeof PDFParseResponseSchema>;
