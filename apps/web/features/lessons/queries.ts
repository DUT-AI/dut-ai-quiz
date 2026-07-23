import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { LessonSchema, ModuleSchema, type Lesson, type Module } from "./types";
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
    mutationFn: (body: { name: string; description?: string; content_md?: string; order?: number; slug?: string; module_id?: string | null }) =>
      apiPost<Lesson>("/api/v1/lessons", body, LessonSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lessons"] }),
  });
}

export function useUpdateLesson(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; content_md?: string; order?: number; slug?: string; module_id?: string | null }) =>
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

export function useModules(options?: any) {
  return useQuery<Module[]>({
    queryKey: ["modules"],
    queryFn: () => apiGet<Module[]>("/api/v1/modules", z.array(ModuleSchema)),
    staleTime: 60_000,
    ...options,
  });
}

export function useCreateModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string; description?: string; order?: number }) =>
      apiPost<Module>("/api/v1/modules", body, ModuleSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

export function useUpdateModule(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name?: string; description?: string; order?: number }) =>
      apiPatch<Module>(`/api/v1/modules/${id}`, body, ModuleSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

export function useDeleteModule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/modules/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

export function useReorderModules() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { module_ids: string[] }) =>
      apiClient.post("/api/v1/modules/reorder", body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["modules"] }),
  });
}

export function useReorderLessons() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { items: { id: string; order: number; module_id: string | null }[] }) =>
      apiClient.post("/api/v1/lessons/reorder", body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lessons"] });
      qc.invalidateQueries({ queryKey: ["modules"] });
    },
  });
}

