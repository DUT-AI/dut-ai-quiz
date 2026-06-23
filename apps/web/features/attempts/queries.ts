import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { z } from "zod";
import {
  AttemptOutSchema,
  AttemptHistoryItemSchema,
  AttemptReviewResponseSchema,
  QuizQuestionSchema,
  StartAttemptResponseSchema,
  type AttemptOut,
  type AttemptHistoryItem,
  type AttemptReviewResponse,
  type QuizQuestion,
  type StartAttemptResponse,
} from "./types";

export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      apiPost<StartAttemptResponse>(`/api/v1/exams/${examId}/attempts`, {}, StartAttemptResponseSchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["attempt", data.attempt_id] });
      void qc.invalidateQueries({ queryKey: ["my-attempts"] });
    },
  });
}

export function useAttempt(attemptId: string | null) {
  const AttemptResponseSchema = z.object({
    attempt: AttemptOutSchema,
    questions: z.array(QuizQuestionSchema),
    saved_answers: z.array(
      z.object({
        question_id: z.string(),
        selected_option_id: z.string().nullable(),
      })
    ),
  });

  type AttemptResponse = z.infer<typeof AttemptResponseSchema>;

  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () =>
      apiGet<AttemptResponse>(
        `/api/v1/attempts/${attemptId!}`,
        AttemptResponseSchema
      ),
    enabled: !!attemptId,
    staleTime: 0, // Always fresh during exam
  });
}

export function usePatchAnswers() {
  return useMutation({
    mutationFn: ({
      attemptId,
      answers,
    }: {
      attemptId: string;
      answers: { question_id: string; selected_option_id: string | null }[];
    }) =>
      apiPatch<{ ok: boolean }>(
        `/api/v1/attempts/${attemptId}/answers`,
        { answers },
        z.object({ ok: z.boolean() })
      ),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiPost<AttemptOut>(`/api/v1/attempts/${attemptId}/submit`, {}, AttemptOutSchema),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["attempt", data.id] });
      void qc.invalidateQueries({ queryKey: ["my-attempts"] });
      void qc.invalidateQueries({ queryKey: ["leaderboard", data.exam_id] });
    },
  });
}

export function useRecordFocusEvent() {
  return useMutation({
    mutationFn: ({
      attemptId,
      event,
      clientEventId,
    }: {
      attemptId: string;
      event: string;
      clientEventId: string;
    }) =>
      apiPost<{ tab_out_count: number; action: string; attempt?: any }>(
        `/api/v1/attempts/${attemptId}/focus-events`,
        {
          event,
          client_event_id: clientEventId,
          client_ts: new Date().toISOString(),
        },
        z.object({
          tab_out_count: z.number(),
          action: z.string(),
          attempt: z.any().optional(),
        })
      ),
  });
}

export function useMyAttempts() {
  return useQuery({
    queryKey: ["my-attempts"],
    queryFn: () => apiGet<AttemptHistoryItem[]>("/api/v1/me/attempts", z.array(AttemptHistoryItemSchema)),
    staleTime: 30_000,
  });
}

export function useAttemptReview(attemptId: string | null) {
  return useQuery({
    queryKey: ["attempt-review", attemptId],
    queryFn: () => apiGet<AttemptReviewResponse>(`/api/v1/attempts/${attemptId!}/review`, AttemptReviewResponseSchema),
    enabled: !!attemptId,
  });
}

export function usePracticeHistory() {
  return useQuery({
    queryKey: ["practice-history"],
    queryFn: () => apiGet<unknown[]>("/api/v1/practice/history"),
    staleTime: 30_000,
  });
}
