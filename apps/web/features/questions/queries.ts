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


