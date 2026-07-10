import { z } from "zod";

export const PoolTypeSchema = z.enum(["PRACTICE", "EXAM", "GAME"]);
export type PoolType = z.infer<typeof PoolTypeSchema>;

export const DifficultySchema = z.enum(["EASY", "MEDIUM", "HARD"]);
export type Difficulty = z.infer<typeof DifficultySchema>;

export const QuestionCreateSchema = z.object({
  content: z.string(),
  options: z.array(z.any()),
  difficulty: DifficultySchema.optional(),
  tags: z.array(z.string()).optional(),
  lesson_id: z.string().nullable().optional(),
  pool_type: PoolTypeSchema.optional(),
  solution: z.string().optional(),
  created_by: z.number().optional(),
});

export type QuestionCreate = z.infer<typeof QuestionCreateSchema>;

/** Strict option schema for form UI */
export const OptionFormSchema = z.object({
  id: z.string(),
  text: z.string().min(1, "Đáp án không được để trống"),
  is_correct: z.boolean(),
});
export type OptionForm = z.infer<typeof OptionFormSchema>;

/** Form schema used in QuestionEditorModal with react-hook-form */
export const QuestionFormSchema = z.object({
  pool_type: PoolTypeSchema,
  difficulty: DifficultySchema,
  content: z.string().min(1, "Nội dung câu hỏi không được để trống"),
  options: z
    .array(OptionFormSchema)
    .min(2, "Cần ít nhất 2 đáp án")
    .refine((opts) => opts.some((o) => o.is_correct), {
      message: "Phải có ít nhất một đáp án đúng",
    }),
  solution: z.string().optional(),
  lesson_id: z.string().optional(),
  tags: z.array(z.string()).optional(),
});
export type QuestionFormValues = z.infer<typeof QuestionFormSchema>;


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
  difficulty: z.string().optional(),
});

export type ParsedQuestionPreview = z.infer<typeof ParsedQuestionPreviewSchema>;

export const PDFParseResponseSchema = z.object({
  questions: z.array(ParsedQuestionPreviewSchema),
  total_pages: z.number(),
  warnings: z.array(z.string()),
});

export type PDFParseResponse = z.infer<typeof PDFParseResponseSchema>;

export const TagOutSchema = z.object({
  id: z.string(),
  name: z.string(),
  created_at: z.string(),
});
export type TagOut = z.infer<typeof TagOutSchema>;
