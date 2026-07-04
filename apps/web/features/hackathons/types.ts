import { z } from "zod";

export const ParticipationModeSchema = z.enum(["individual", "team", "both"]);
export type ParticipationMode = z.infer<typeof ParticipationModeSchema>;

export const HackathonSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Tên hackathon không được để trống"),
  description: z.string().default(""),
  rules: z.string().default(""),
  start_time: z.string().nullable().optional(),
  end_time: z.string().nullable().optional(),
  participation_mode: ParticipationModeSchema.default("both"),
  created_by: z.number().optional(),
});

export type Hackathon = z.infer<typeof HackathonSchema>;
