import {
  useQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "./api";
import type {
  AttemptOut,
  ExamCreate,
  ExamOut,
  ExamTile,
  LeaderboardEntry,
  Lesson,
  QuestionCreate,
  QuestionOut,
  UserMe,
  ExternalTeam,
  ExternalUser,
  AttemptHistoryItem,
  AttemptReviewResponse,
  QuizQuestion,
  ExamStats,
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

/* ──────────── Lessons ──────────── */
export function useLessons() {
  return useQuery({
    queryKey: ["lessons"],
    queryFn: () => apiGet<Lesson[]>("/api/v1/lessons"),
    staleTime: 60_000,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; order?: number }) =>
      apiPost<Lesson>("/api/v1/lessons", body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; order?: number }) =>
      apiPatch<Lesson>(`/api/v1/lessons/${id}`, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useDeleteLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/lessons/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

/* ──────────── Auth ──────────── */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => apiGet<UserMe>("/api/v1/me"),
    staleTime: 300_000,
    retry: false,
  });
}

/* ──────────── Exams ──────────── */
export function useExams() {
  return useQuery({
    queryKey: ["exams"],
    queryFn: async () => {
      const raw = await apiGet<ExamOut[]>("/api/v1/exams");
      return toExamTiles(raw);
    },
    staleTime: 60_000,
    retry: 1,
  });
}

export function useExamsFull() {
  return useQuery({
    queryKey: ["exams-full"],
    queryFn: () => apiGet<ExamOut[]>("/api/v1/exams"),
    staleTime: 60_000,
  });
}

export function useExam(id: string | null) {
  return useQuery({
    queryKey: ["exam", id],
    queryFn: () => apiGet<ExamOut>(`/api/v1/exams/${id!}`),
    enabled: !!id,
  });
}

export function useExamStats(examId: string | null) {
  return useQuery({
    queryKey: ["exam-stats", examId],
    queryFn: () => apiGet<ExamStats>(`/api/v1/exams/${examId!}/stats`),
    enabled: !!examId,
  });
}

export function useExamQuestions(examId: string | null) {
  return useQuery({
    queryKey: ["exam-questions", examId],
    queryFn: () => apiGet<QuestionOut[]>(`/api/v1/exams/${examId!}/questions`),
    enabled: !!examId,
  });
}

export function useCreateExam() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: ExamCreate) =>
      apiPost<ExamOut>("/api/v1/exams", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["exams-full"] });
    },
  });
}

export function useUpdateExam(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<ExamCreate>) =>
      apiPatch<ExamOut>(`/api/v1/exams/${id}`, body),
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

/* ──────────── Questions ──────────── */
export function useQuestions(params?: {
  pool_type?: string;
  tag?: string;
  lesson_id?: string;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.pool_type) search.set("pool_type", params.pool_type);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.lesson_id) search.set("lesson_id", params.lesson_id);
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString() ? `?${search.toString()}` : "";

  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => apiGet<QuestionOut[]>(`/api/v1/questions${qs}`),
    staleTime: 30_000,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestionCreate) =>
      apiPost<QuestionOut>("/api/v1/questions", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<QuestionCreate> }) =>
      apiPatch<QuestionOut>(`/api/v1/questions/${id}`, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useDeleteQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/questions/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useBulkCreateQuestions() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { 
      questions: { question: string; options: any[]; solution?: string }[]; 
      lesson_id?: string;
      pool_type?: string;
    }) =>
      apiPost<QuestionOut[]>("/api/v1/questions/bulk", body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

/* ──────────── Leaderboard ──────────── */
export function useLeaderboard(examId: string | null) {
  return useQuery({
    queryKey: ["leaderboard", examId],
    queryFn: () =>
      apiGet<LeaderboardEntry[]>(`/api/v1/exams/${examId!}/leaderboard`),
    enabled: !!examId,
    staleTime: 30_000,
  });
}

/* ──────────── History ──────────── */
export function useMyAttempts() {
  return useQuery({
    queryKey: ["my-attempts"],
    queryFn: () => apiGet<AttemptHistoryItem[]>("/api/v1/me/attempts"),
    staleTime: 30_000,
  });
}

export function useAttemptReview(attemptId: string | null) {
  return useQuery({
    queryKey: ["attempt-review", attemptId],
    queryFn: () => apiGet<AttemptReviewResponse>(`/api/v1/attempts/${attemptId!}/review`),
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

/* ──────────── Attempts (Exam Taking) ──────────── */
export function useStartAttempt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (examId: string) =>
      apiPost<StartAttemptResponse>(`/api/v1/exams/${examId}/attempts`, {}),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ["attempt", data.attempt_id] });
      void qc.invalidateQueries({ queryKey: ["my-attempts"] });
    },
  });
}

export function useAttempt(attemptId: string | null) {
  return useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () =>
      apiGet<{ attempt: AttemptOut; questions: QuizQuestion[] }>(
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
      apiPatch<{ ok: boolean }>(`/api/v1/attempts/${attemptId}/answers`, {
        answers,
      }),
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

/* ──────────── Presign upload ──────────── */
export function usePresignUpload() {
  return useMutation({
    mutationFn: ({
      key,
      content_type,
    }: {
      key: string;
      content_type: string;
    }) =>
      apiPost<{ presigned_url: string; key: string; public_url: string }>(
      ),
  });
}

/* ──────────── External Proxy ──────────── */
export function useExternalTeams() {
  return useQuery({
    queryKey: ["external-teams"],
    queryFn: () => apiGet<{ data: ExternalTeam[] }>("/api/v1/external/teams"),
    staleTime: 300_000,
  });
}

export function useExternalUsers() {
  return useQuery({
    queryKey: ["external-users"],
    queryFn: () => apiGet<{ data: ExternalUser[] }>("/api/v1/external/users"),
    staleTime: 300_000,
  });
}
