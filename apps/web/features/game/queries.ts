import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch } from "@/lib/api";
import { z } from "zod";
import {
  StartGameSessionResponseSchema,
  GameSessionSchema,
  GamificationAnswerResultOutSchema,
  GameLeaderboardRowOutSchema,
  GameLessonSummaryOutSchema,
  type StartGameSessionResponse,
  type GameSession,
  type GamificationAnswerResultOut,
  type GameLeaderboardRowOut,
  type GameLessonSummaryOut,
} from "./types";

export function useActiveGameSession(lessonSlug: string, options?: any) {
  return useQuery<StartGameSessionResponse, Error & { status?: number }>({
    queryKey: ["game", "sessions", "active", lessonSlug],
    queryFn: () =>
      apiGet<StartGameSessionResponse>(
        `/api/v1/game/sessions/active?lesson_slug=${encodeURIComponent(lessonSlug)}`,
        StartGameSessionResponseSchema
      ),
    staleTime: 0,
    gcTime: 0, // Disable caching so it's always fetched fresh when component mounts
    retry: false, // Don't retry on 404
    enabled: !!lessonSlug,
    ...options,
  });
}

export function useStartGameSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { lesson_slug: string }) =>
      apiPost<StartGameSessionResponse>(
        "/api/v1/game/sessions",
        body,
        StartGameSessionResponseSchema
      ),
    onSuccess: (_, variables) => {
      void qc.invalidateQueries({
        queryKey: ["game", "sessions", "active", variables.lesson_slug],
      });
    },
  });
}

export function useGetGameSession(sessionId: string, options?: any) {
  return useQuery<GameSession>({
    queryKey: ["game", "sessions", sessionId],
    queryFn: () =>
      apiGet<GameSession>(`/api/v1/game/sessions/${sessionId}`, GameSessionSchema),
    enabled: !!sessionId,
    ...options,
  });
}

export function usePatchGameAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: {
      session_id: string;
      question_id: string;
      option_id: string;
      time_response: number;
      activate_shield?: boolean;
      activate_double_points?: boolean;
    }) => {
      const { session_id, ...payload } = body;
      return apiPatch<GamificationAnswerResultOut>(
        `/api/v1/game/sessions/${session_id}/answers`,
        payload,
        GamificationAnswerResultOutSchema
      );
    },
    onSuccess: (data) => {
      if (data.is_game_over) {
        void qc.invalidateQueries({ queryKey: ["game", "sessions"] });
        void qc.invalidateQueries({ queryKey: ["game", "leaderboard"] });
        void qc.invalidateQueries({ queryKey: ["game", "history", "summary"] });
      }
    },
  });
}

export function useUseGameItem() {
  return useMutation({
    mutationFn: (body: { session_id: string; item_name: string; question_id: string }) => {
      const { session_id, ...payload } = body;
      return apiPost<any>(`/api/v1/game/sessions/${session_id}/use-item`, payload);
    },
  });
}

export function useFinishGameSession() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (sessionId: string) =>
      apiPost<GameSession>(`/api/v1/game/sessions/${sessionId}/finish`, {}),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["game", "sessions"] });
      void qc.invalidateQueries({ queryKey: ["game", "leaderboard"] });
      void qc.invalidateQueries({ queryKey: ["game", "history", "summary"] });
    },
  });
}

export function useGameLeaderboard(lessonSlug: string, options?: any) {
  return useQuery<GameLeaderboardRowOut[]>({
    queryKey: ["game", "leaderboard", lessonSlug],
    queryFn: () =>
      apiGet<GameLeaderboardRowOut[]>(
        `/api/v1/game/${encodeURIComponent(lessonSlug)}/leaderboard`,
        z.array(GameLeaderboardRowOutSchema)
      ),
    enabled: !!lessonSlug,
    staleTime: 10_000,
    ...options,
  });
}

export function useGameHistorySummary(options?: any) {
  return useQuery<GameLessonSummaryOut[]>({
    queryKey: ["game", "history", "summary"],
    queryFn: () =>
      apiGet<GameLessonSummaryOut[]>(
        "/api/v1/game/history/summary",
        z.array(GameLessonSummaryOutSchema)
      ),
    staleTime: 5000,
    ...options,
  });
}
