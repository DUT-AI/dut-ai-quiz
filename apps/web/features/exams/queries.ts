import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { QuestionOutSchema, type QuestionOut } from "../questions/types";
import { z } from "zod";
import {
  ExamOutSchema,
  LeaderboardEntrySchema,
  ExamStatsSchema,
  ExternalTeamSchema,
  ExternalUserSchema,
  type ExamOut,
  type ExamTile,
  type ExamCreate,
  type ExamStats,
  type LeaderboardEntry,
  type ExternalTeam,
  type ExternalUser,
} from "./types";

const ICONS = [
  "/assets/images/icon-html.svg",
  "/assets/images/icon-css.svg",
  "/assets/images/icon-js.svg",
  "/assets/images/icon-accessibility.svg",
];

function toExamTiles(exams: ExamOut[]): ExamTile[] {
  return exams.map((e, i) => ({
    id: e.id,
    title: e.title,
    icon: ICONS[i % ICONS.length],
  }));
}

export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const raw = await apiGet<ExamOut[]>("/api/v1/exams", z.array(ExamOutSchema));
      return toExamTiles(raw);
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useExamsFull(options?: any) {
  return useQuery<ExamOut[]>({
    queryKey: ["exams-full"],
    queryFn: () => apiGet<ExamOut[]>("/api/v1/exams", z.array(ExamOutSchema)),
    staleTime: 60_000,
    ...options,
  });
}

export function useExam(id: string | null) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => apiGet<ExamOut>(`/api/v1/exams/${id!}`, ExamOutSchema),
    enabled: !!id,
  });
}

export function useExamStats(examId: string | null) {
  return useQuery({
    queryKey: ["exam-stats", examId],
    queryFn: () => apiGet<ExamStats>(`/api/v1/exams/${examId!}/stats`, ExamStatsSchema),
    enabled: !!examId,
  });
}

export function useExamQuestions(examId: string | null) {
  return useQuery({
    queryKey: ["exam-questions", examId],
    queryFn: () => apiGet<QuestionOut[]>(`/api/v1/exams/${examId!}/questions`, z.array(QuestionOutSchema)),
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExamCreate) =>
      apiPost<ExamOut>("/api/v1/exams", body, ExamOutSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exams-full"] });
    },
  });
}

export function useUpdateExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ExamCreate>) =>
      apiPatch<ExamOut>(`/api/v1/exams/${id}`, body, ExamOutSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exams-full"] });
      void qc.invalidateQueries({ queryKey: ["exam", id] });
    },
  });
}

export function useDeleteExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/exams/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exams-full"] });
    },
  });
}

export function useSetExamQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ examId, questionIds }: { examId: string; questionIds: string[] }) =>
      apiClient
        .put(`/api/v1/exams/${examId}/questions`, {
          question_ids: questionIds,
        })
        .then((r) => r.data),
    onSuccess: (_, { examId }) => {
      void qc.invalidateQueries({ queryKey: ["exam-questions", examId] });
    },
  });
}

export function useLeaderboard(examId: string | null) {
  return useQuery({
    queryKey: ["leaderboard", examId],
    queryFn: () =>
      apiGet<LeaderboardEntry[]>(`/api/v1/exams/${examId!}/leaderboard`, z.array(LeaderboardEntrySchema)),
    enabled: !!examId,
    staleTime: 30_000,
  });
}

export function useExternalTeams() {
  return useQuery({
    queryKey: ["external-teams"],
    queryFn: () =>
      apiGet<{ data: ExternalTeam[] }>("/api/v1/external/teams", z.object({ data: z.array(ExternalTeamSchema) })),
    staleTime: 300_000,
  });
}

export function useExternalUsers() {
  return useQuery({
    queryKey: ["external-users"],
    queryFn: () =>
      apiGet<{ data: ExternalUser[] }>("/api/v1/external/users", z.object({ data: z.array(ExternalUserSchema) })),
    staleTime: 300_000,
  });
}
