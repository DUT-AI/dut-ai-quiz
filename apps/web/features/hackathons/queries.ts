import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { HackathonSchema, type Hackathon } from "./types";
import { z } from "zod";

export function useHackathons(options?: any) {
  return useQuery<Hackathon[]>({
    queryKey: ["hackathons"],
    queryFn: () => apiGet<Hackathon[]>("/api/v1/hackathons", z.array(HackathonSchema)),
    staleTime: 60_000,
    ...options,
  });
}

export function useHackathon(id: string, options?: any) {
  return useQuery<Hackathon>({
    queryKey: ["hackathons", id],
    queryFn: () => apiGet<Hackathon>(`/api/v1/hackathons/${id}`, HackathonSchema),
    staleTime: 60_000,
    enabled: !!id,
    ...options,
  });
}

export function useCreateHackathon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<Hackathon, "id" | "created_by">) =>
      apiPost<Hackathon>("/api/v1/hackathons", body, HackathonSchema),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hackathons"] }),
  });
}

export function useUpdateHackathon(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Partial<Omit<Hackathon, "id" | "created_by">>) =>
      apiPatch<Hackathon>(`/api/v1/hackathons/${id}`, body, HackathonSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons"] });
      qc.invalidateQueries({ queryKey: ["hackathons", id] });
    },
  });
}

export function useDeleteHackathon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      apiClient.delete(`/api/v1/hackathons/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hackathons"] }),
  });
}
