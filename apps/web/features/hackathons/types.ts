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

export const MetricTypeSchema = z.enum([
  "accuracy",
  "balanced_accuracy",
  "precision",
  "recall",
  "f1_score",
  "f1_macro",
  "f1_weighted",
  "roc_auc",
  "log_loss",
  "mae",
  "mse",
  "rmse",
  "r2",
  "mape",
]);
export type MetricType = z.infer<typeof MetricTypeSchema>;

export const METRIC_OPTIONS: ReadonlyArray<{
  value: MetricType;
  label: string;
  group: "Classification" | "Regression";
}> = [
  { value: "accuracy", label: "Accuracy", group: "Classification" },
  { value: "balanced_accuracy", label: "Balanced Accuracy", group: "Classification" },
  { value: "precision", label: "Precision (binary)", group: "Classification" },
  { value: "recall", label: "Recall (binary)", group: "Classification" },
  { value: "f1_score", label: "F1-Score (binary)", group: "Classification" },
  { value: "f1_macro", label: "Macro F1", group: "Classification" },
  { value: "f1_weighted", label: "Weighted F1", group: "Classification" },
  { value: "roc_auc", label: "ROC-AUC (binary)", group: "Classification" },
  { value: "log_loss", label: "Log Loss (binary)", group: "Classification" },
  { value: "mae", label: "MAE", group: "Regression" },
  { value: "mse", label: "MSE", group: "Regression" },
  { value: "rmse", label: "RMSE", group: "Regression" },
  { value: "r2", label: "R²", group: "Regression" },
  { value: "mape", label: "MAPE", group: "Regression" },
];

export function getMetricLabel(metric: string): string {
  return METRIC_OPTIONS.find((option) => option.value === metric)?.label ?? metric;
}

export const HackathonTaskSchema = z.object({
  id: z.string(),
  hackathon_id: z.string(),
  name: z.string().min(1, "Tên đề bài không được để trống"),
  problem_description_md: z.string().default(""),
  private_test_url: z.string().default(""),
  public_test_url: z.string().default(""),
  metric_type: MetricTypeSchema,
  max_submissions: z.number().default(10),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});
export type HackathonTask = z.infer<typeof HackathonTaskSchema>;

export const SubmissionStatusSchema = z.enum([
  "UPLOADING",
  "EXTRACTING",
  "RUNNING",
  "EVALUATING",
  "PUBLISHED",
  "FAILED",
  "CANCELLED",
]);
export type SubmissionStatus = z.infer<typeof SubmissionStatusSchema>;

export const HackathonSubmissionSchema = z.object({
  id: z.string(),
  task_id: z.string(),
  user_id: z.number(),
  team_id: z.string().nullable().optional(),
  script_url: z.string(),
  model_url: z.string().nullable().optional(),
  status: SubmissionStatusSchema,
  score: z.number().nullable().optional(),
  error_message: z.string().nullable().optional(),
  logs: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string().nullable().optional(),
});
export type HackathonSubmission = z.infer<typeof HackathonSubmissionSchema>;

export const PresignURLInfoSchema = z.object({
  upload_url: z.string(),
  s3_key: z.string(),
  download_url: z.string(),
});
export type PresignURLInfo = z.infer<typeof PresignURLInfoSchema>;

export const PresignSubmitOutSchema = z.object({
  submission_id: z.string(),
  script: PresignURLInfoSchema,
  model: PresignURLInfoSchema.nullable().optional(),
});
export type PresignSubmitOut = z.infer<typeof PresignSubmitOutSchema>;



