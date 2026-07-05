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
  max_team_members: z.number().default(5),
  created_by: z.number().optional(),
});

export type Hackathon = z.infer<typeof HackathonSchema>;

export const RegistrationStatusSchema = z.enum(["pending", "approved", "rejected", "cancelled"]);
export type RegistrationStatus = z.infer<typeof RegistrationStatusSchema>;

export const TeamMemberSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string(),
});
export type TeamMember = z.infer<typeof TeamMemberSchema>;

export const HackathonTeamSchema = z.object({
  id: z.string(),
  hackathon_id: z.string(),
  name: z.string(),
  code: z.string(),
  leader_id: z.number(),
  member_ids: z.array(z.number()),
  members: z.array(TeamMemberSchema).default([]),
  created_at: z.string(),
});
export type HackathonTeam = z.infer<typeof HackathonTeamSchema>;

export const HackathonRegistrationSchema = z.object({
  id: z.string(),
  hackathon_id: z.string(),
  user_id: z.number().nullable().optional(),
  team_id: z.string().nullable().optional(),
  status: RegistrationStatusSchema,
  registered_at: z.string(),
  reviewed_by: z.number().nullable().optional(),
  rejection_reason: z.string().nullable().optional(),
  
  team: HackathonTeamSchema.nullable().optional(),
  user: TeamMemberSchema.nullable().optional(),
});
export type HackathonRegistration = z.infer<typeof HackathonRegistrationSchema>;

