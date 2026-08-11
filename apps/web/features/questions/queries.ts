import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { z } from "zod";
import {
  QuestionOutSchema,
  PDFParseResponseSchema,
  TagOutSchema,
  type QuestionCreate,
  type QuestionOut,
  type PDFParseResponse,
  type TagOut,
} from "./types";

export function useQuestions(params?: {
  pool_type?: string;
  tag?: string;
  lesson_id?: string;
  import_session_id?: string;
  status?: string;
  difficulty?: string;
  offset?: number;
  limit?: number;
}) {
  const search = new URLSearchParams();
  if (params?.pool_type) search.set("pool_type", params.pool_type);
  if (params?.tag) search.set("tag", params.tag);
  if (params?.lesson_id) search.set("lesson_id", params.lesson_id);
  if (params?.import_session_id) search.set("import_session_id", params.import_session_id);
  if (params?.status) search.set("status", params.status);
  if (params?.difficulty) search.set("difficulty", params.difficulty);
  if (params?.offset !== undefined) search.set("offset", String(params.offset));
  if (params?.limit) search.set("limit", String(params.limit));

  const qs = search.toString() ? `?${search.toString()}` : "";

  return useQuery({
    queryKey: ["questions", params],
    queryFn: () => apiGet<QuestionOut[]>(`/api/v1/questions${qs}`, z.array(QuestionOutSchema)),
    staleTime: 30_000,
  });
}

export function useCreateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: QuestionCreate) =>
      apiPost<QuestionOut>("/api/v1/questions", body, QuestionOutSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useUpdateQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<QuestionCreate> }) =>
      apiPatch<QuestionOut>(`/api/v1/questions/${id}`, payload, QuestionOutSchema),
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
      questions: { question: string; options: any[]; solution?: string; pool_type?: string }[];
      lesson_id?: string;
      pool_type?: string;
      tags?: string[];
    }) =>
      apiPost<QuestionOut[]>("/api/v1/questions/bulk", body, z.array(QuestionOutSchema)),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
    },
  });
}

export function useParsePDF() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const res = await apiClient.post<PDFParseResponse>(
        "/api/v1/questions/parse-pdf",
        formData,
        PDFParseResponseSchema
      );
      return res.data;
    },
  });
}

export function useImportPDF() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/import-pdf` : "/api/v1/pdf-import/import-pdf";

      const res = await apiClient.post<{ job_id: string; status: string; message: string }>(
        path,
        formData
      );
      return res.data;
    },
  });
}

export function useUploadPDF() {
  return useMutation({
    mutationFn: async (formData: FormData) => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/upload` : "/api/v1/pdf-import/upload";

      const res = await apiClient.post<{ ok: boolean; job_id: string; status: string }>(
        path,
        formData
      );
      return res.data;
    },
  });
}

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
        "/api/v1/uploads/presign",
        { key, content_type },
        z.object({
          presigned_url: z.string(),
          key: z.string(),
          public_url: z.string(),
        })
      ),
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: () => apiGet<TagOut[]>("/api/v1/tags", z.array(TagOutSchema)),
    staleTime: 5 * 60_000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiPost<TagOut>("/api/v1/tags", body, TagOutSchema),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/tags/${id}`).then((r) => r.data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["tags"] });
    },
  });
}

export function useQuestion(id: string) {
  return useQuery({
    queryKey: ["question", id],
    queryFn: () => apiGet<QuestionOut>(`/api/v1/questions/${id}`, QuestionOutSchema),
    enabled: !!id,
  });
}

export function useImportSessionStatus(jobId: string, enabled: boolean = false) {
  const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
  const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/${jobId}/status` : `/api/v1/pdf-import/${jobId}/status`;

  return useQuery({
    queryKey: ["pdf-import", "status", jobId],
    queryFn: () =>
      apiGet<{
        job_id: string;
        status: "PROCESSING" | "COMPLETED" | "FAILED";
        total_questions: number;
        processed_questions: number;
        error_message: string | null;
        file_name: string;
        created_at: string;
      }>(path),
    enabled: !!jobId && enabled,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data?.status === "COMPLETED" || data?.status === "FAILED") {
        return false;
      }
      return 2000;
    },
  });
}

export function useDraftQuestions(jobId: string) {
  const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
  const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/${jobId}/questions` : `/api/v1/pdf-import/${jobId}/questions`;

  return useQuery({
    queryKey: ["pdf-import", "questions", jobId],
    queryFn: () =>
      apiGet<{
        questions: any[];
        total: number;
      }>(path),
    enabled: !!jobId,
  });
}

export function useApproveQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: {
        content?: string;
        solution?: string;
        difficulty?: string;
        lesson_id?: string;
      };
    }) => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/questions/${id}/approve` : `/api/v1/pdf-import/questions/${id}/approve`;
      return apiPatch<{ ok: boolean; question_id: string; status: string }>(
        path,
        payload
      );
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
      void qc.invalidateQueries({ queryKey: ["pdf-import", "questions"] });
    },
  });
}

export function useRejectQuestion() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/questions/${id}` : `/api/v1/pdf-import/questions/${id}`;
      const res = await apiClient.delete<{ ok: boolean; question_id: string; deleted: boolean }>(path);
      return res.data;
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ["questions"] });
      void qc.invalidateQueries({ queryKey: ["pdf-import", "questions"] });
    },
  });
}

export function useRegenerateSolution() {
  return useMutation({
    mutationFn: async ({ id, admin_hint }: { id: string; admin_hint?: string }) => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/pdf-import/questions/${id}/regenerate-solution` : `/api/v1/pdf-import/questions/${id}/regenerate-solution`;
      return apiPost<{ ok: boolean; question_id: string; solution: string }>(
        path,
        { admin_hint: admin_hint || "" }
      );
    },
  });
}

export function useCheckRelatedQuestions(params: {
  content: string;
  pool_type?: string;
  enabled?: boolean;
}) {
  return useQuery({
    queryKey: ["questions", "related-live", params.content, params.pool_type],
    queryFn: () => {
      const backendUrl = process.env.NODE_ENV === "development" ? "http://localhost:8000" : "";
      const path = backendUrl ? `${backendUrl}/api/v1/questions/related` : `/api/v1/questions/related`;
      return apiPost<any[]>(path, {
        content: params.content,
        pool_type: params.pool_type || "PRACTICE",
        limit: 5,
        min_score: 0.7,
      });
    },
    enabled: !!params.enabled && params.content.trim().length >= 5,
    staleTime: 30_000,
  });
}


