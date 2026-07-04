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

import {
  HackathonRegistrationSchema,
  HackathonTeamSchema,
  type HackathonRegistration,
  type HackathonTeam,
  type RegistrationStatus,
} from "./types";

export function useHackathonRegistrationStatus(hackathonId: string, options?: any) {
  return useQuery<{
    is_registered: boolean;
    registration: HackathonRegistration | null;
    team: HackathonTeam | null;
  }>({
    queryKey: ["hackathons", hackathonId, "registration-status"],
    queryFn: () => apiGet<any>(`/api/v1/hackathons/${hackathonId}/registration/status`),
    staleTime: 5_000,
    enabled: !!hackathonId,
    ...options,
  });
}

export function useRegisterIndividual(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiPost<HackathonRegistration>(`/api/v1/hackathons/${hackathonId}/register/individual`, {}, HackathonRegistrationSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
    },
  });
}

export function useCreateTeam(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { name: string }) =>
      apiPost<HackathonTeam>(`/api/v1/hackathons/${hackathonId}/register/team/create`, body, HackathonTeamSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
    },
  });
}

export function useJoinTeam(hackathonId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string }) =>
      apiPost<HackathonTeam>("/api/v1/hackathons/register/team/join", body, HackathonTeamSchema),
    onSuccess: () => {
      if (hackathonId) {
        qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
      } else {
        qc.invalidateQueries({ queryKey: ["hackathons"] });
      }
    },
  });
}

export function useLeaveTeam(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { new_leader_id?: number | null }) =>
      apiPost<any>(`/api/v1/hackathons/${hackathonId}/register/team/leave`, body, z.any()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
    },
  });
}

export function useCancelRegistration(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () =>
      apiClient.delete<any>(`/api/v1/hackathons/${hackathonId}/register/cancel`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
    },
  });
}

export function useHackathonRegistrations(hackathonId: string, options?: any) {
  return useQuery<HackathonRegistration[]>({
    queryKey: ["hackathons", hackathonId, "registrations"],
    queryFn: () =>
      apiGet<HackathonRegistration[]>(`/api/v1/hackathons/${hackathonId}/registrations`, z.array(HackathonRegistrationSchema)),
    staleTime: 30_000,
    enabled: !!hackathonId,
    ...options,
  });
}

export function useReviewRegistration(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ registrationId, body }: { registrationId: string; body: { status: RegistrationStatus; rejection_reason?: string | null } }) =>
      apiPost<HackathonRegistration>(`/api/v1/hackathons/${hackathonId}/registrations/${registrationId}/review`, body, HackathonRegistrationSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registrations"] });
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
    },
  });
}

