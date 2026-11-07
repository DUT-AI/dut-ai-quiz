import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import type {
  ActiveAttempt,
  AttemptHistoryItem,
  AttemptOut,
  AttemptReviewResponse,
  GetAttemptResponse,
  StartAttemptResponse,
} from "./types";

export function useActiveAttempt(examId: string | null) {
  return useQuery<ActiveAttempt | null>({
    queryKey: ["active-attempt", examId],
    queryFn: () =>
      apiGet<ActiveAttempt | null>(
        `/api/v1/exams/${examId!}/my-active-attempt`
      ),
    enabled: !!examId,
    staleTime: 5000,
  });
}

export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      examId,
      action = "start",
    }: {
      examId: string;
      action?: "start" | "restart";
    }) =>
      apiPost<StartAttemptResponse>(
        `/api/v1/exams/${examId}/attempts`,
        { action }
      ),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["attempt", data.attempt_id] });
      void qc.invalidateQueries({ queryKey: ["my-attempts"] });
      void qc.invalidateQueries({ queryKey: ["active-attempt"] });
    },
  });
}

export function useAttempt(attemptId: string | null) {
  return useQuery<GetAttemptResponse>({
    queryKey: ["attempt", attemptId],
    queryFn: () =>
      apiGet<GetAttemptResponse>(
        `/api/v1/attempts/${attemptId!}`
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
        { answers }
      ),
  });
}

export function useSubmitAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (attemptId: string) =>
      apiPost<AttemptOut>(`/api/v1/attempts/${attemptId}/submit`, {}),
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
        }
      ),
  });
}

export function useMyAttempts() {
  return useQuery<AttemptHistoryItem[]>({
    queryKey: ["my-attempts"],
    queryFn: () => apiGet<AttemptHistoryItem[]>("/api/v1/me/attempts"),
    staleTime: 30_000,
  });
}

export function useAttemptReview(attemptId: string | null) {
  return useQuery<AttemptReviewResponse>({
    queryKey: ["attempt-review", attemptId],
    queryFn: () =>
      apiGet<AttemptReviewResponse>(`/api/v1/attempts/${attemptId!}/review`),
    enabled: !!attemptId,
  });
}

export function useGameHistory() {
  return useQuery<unknown[]>({
    queryKey: ["game-history"],
    queryFn: () => apiGet<unknown[]>("/api/v1/game/history"),
    staleTime: 30_000,
  });
}
