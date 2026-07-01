import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { LessonSchema, type Lesson } from "./types";
import { z } from "zod";

export function useLessons(options?: any) {
  return useQuery<Lesson[]>({
    queryKey: ["lessons"],
    queryFn: () => apiGet<Lesson[]>("/api/v1/lessons", z.array(LessonSchema)),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateLesson() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; order?: number }) =>
      apiPost<Lesson>("/api/v1/lessons", body, LessonSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; order?: number }) =>
      apiPatch<Lesson>(`/api/v1/lessons/${id}`, body, LessonSchema),
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

export function useLessonBySlug(slug: string, options?: any) {
  return useQuery<Lesson>({
    queryKey: ["lessons", "by-slug", slug],
    queryFn: () => apiGet<Lesson>(`/api/v1/lessons/by-slug/${slug}`, LessonSchema),
    staleTime: 60_000,
    enabled: !!slug,
    ...options,
  });
}

