import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { apiGet, apiPost, apiPatch, apiClient } from "@/lib/api";
import { HackathonSchema, type Hackathon, HackathonRegistrationSchema, type HackathonRegistration, type RegistrationStatus, HackathonTaskSchema, type HackathonTask, type MetricType, HackathonTeamSchema, type HackathonTeam, HackathonSubmissionSchema, type HackathonSubmission, PresignSubmitOutSchema, type PresignSubmitOut } from "./types";
import { z } from "zod";
import { API_BASE } from "@/lib/config";

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

export function useJoinTeam(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { code: string }) =>
      apiPost<HackathonTeam>(`/api/v1/hackathons/${hackathonId}/register/team/join`, body, HackathonTeamSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "registration-status"] });
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

export function useHackathonTasks(hackathonId: string, options?: any) {
  return useQuery<HackathonTask[]>({
    queryKey: ["hackathons", hackathonId, "tasks"],
    queryFn: () =>
      apiGet<HackathonTask[]>(`/api/v1/hackathons/${hackathonId}/tasks`, z.array(HackathonTaskSchema)),
    staleTime: 30_000,
    enabled: !!hackathonId,
    ...options,
  });
}

export function useCreateHackathonTask(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Omit<HackathonTask, "id" | "hackathon_id" | "created_at" | "updated_at">) =>
      apiPost<HackathonTask>(`/api/v1/hackathons/${hackathonId}/tasks`, body, HackathonTaskSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "tasks"] });
    },
  });
}

export function useUpdateHackathonTask(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: Partial<Omit<HackathonTask, "id" | "hackathon_id" | "created_at" | "updated_at">> }) =>
      apiPatch<HackathonTask>(`/api/v1/hackathons/${hackathonId}/tasks/${taskId}`, body, HackathonTaskSchema),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "tasks"] });
    },
  });
}

export function useDeleteHackathonTask(hackathonId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) =>
      apiClient.delete<any>(`/api/v1/hackathons/${hackathonId}/tasks/${taskId}`).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["hackathons", hackathonId, "tasks"] });
    },
  });
}

/** Upload a single file directly to S3 using a presigned PUT URL, tracking progress in real-time. */
function uploadFileToS3WithProgress(
  presignedUrl: string,
  file: File,
  onProgress: (loaded: number, total: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", presignedUrl, true);
    xhr.setRequestHeader("Content-Type", "application/octet-stream");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded, event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`S3 upload failed: HTTP ${xhr.status}`));
      }
    };

    xhr.onerror = () => reject(new Error("Lỗi kết nối mạng khi tải lên S3"));
    xhr.send(file);
  });
}

interface SubmitTaskInput {
  scriptFile: File;
  modelFile: File | null;
  onProgress: (phase: "script" | "model" | "commit", loaded: number, total: number) => void;
}

export function useSubmitTask(taskId: string) {
  const qc = useQueryClient();
  return useMutation<HackathonSubmission, Error, SubmitTaskInput>({
    mutationFn: async ({ scriptFile, modelFile, onProgress }) => {
      console.log("[SUBMIT_PERF] Bắt đầu quá trình nộp bài...");
      const start = performance.now();

      // Step 1: Request presigned upload URLs from backend
      const presignStart = performance.now();
      const presign = await apiPost<PresignSubmitOut>(
        `/api/v1/hackathons/tasks/${taskId}/presign-submit`,
        {
          script_filename: scriptFile.name,
          model_filename: modelFile?.name ?? null,
        },
        PresignSubmitOutSchema
      );
      console.log(`[SUBMIT_PERF] 1. Lấy Presigned URLs: ${(performance.now() - presignStart).toFixed(2)} ms`);

      // Step 2a: Upload script directly to S3
      const scriptStart = performance.now();
      await uploadFileToS3WithProgress(
        presign.script.upload_url,
        scriptFile,
        (loaded, total) => {
          onProgress("script", loaded, total);
        }
      );
      console.log(`[SUBMIT_PERF] 2a. Upload Script lên S3 (gồm cả ghi đĩa): ${(performance.now() - scriptStart).toFixed(2)} ms`);

      // Step 2b: Upload model weights directly to S3 if provided
      if (modelFile && presign.model) {
        const modelStart = performance.now();
        await uploadFileToS3WithProgress(
          presign.model.upload_url,
          modelFile,
          (loaded, total) => {
            onProgress("model", loaded, total);
          }
        );
        console.log(`[SUBMIT_PERF] 2b. Upload Model Weights lên S3 (gồm cả ghi đĩa): ${(performance.now() - modelStart).toFixed(2)} ms`);
      }

      // Step 3: Commit to backend — save DB record and enqueue evaluation job
      const commitStart = performance.now();
      onProgress("commit", 0, 0);
      const res = await apiPost<HackathonSubmission>(
        `/api/v1/hackathons/tasks/${taskId}/submit`,
        {
          submission_id: presign.submission_id,
        },
        HackathonSubmissionSchema
      );
      console.log(`[SUBMIT_PERF] 3. Commit lên Backend API: ${(performance.now() - commitStart).toFixed(2)} ms`);
      console.log(`[SUBMIT_PERF] === TỔNG THỜI GIAN HOÀN TẤT ===: ${(performance.now() - start).toFixed(2)} ms`);
      return res;
    },
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["hackathons", "tasks", taskId, "submissions"],
      });
    },
  });
}

export function useSubmissions(taskId: string, options?: any) {
  return useQuery<HackathonSubmission[]>({
    queryKey: ["hackathons", "tasks", taskId, "submissions"],
    queryFn: () =>
      apiGet<HackathonSubmission[]>(
        `/api/v1/hackathons/tasks/${taskId}/submissions`,
        z.array(HackathonSubmissionSchema)
      ),
    staleTime: 5_000,
    enabled: !!taskId,
    ...options,
  });
}

export function useTaskSubmissionEvents(taskId: string, enabled = true) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!taskId || !enabled || typeof window === "undefined") return;

    const url = `${API_BASE}/api/v1/hackathons/tasks/${taskId}/leaderboard/events`;
    const source = new EventSource(url, { withCredentials: true });

    const handleUpdate = (event: Event) => {
      const message = event as MessageEvent<string>;
      try {
        const payload = JSON.parse(message.data);
        qc.setQueryData(
          ["hackathons", "tasks", taskId, "leaderboard"],
          payload.leaderboard ?? []
        );
      } catch {
        /* ignore malformed realtime payloads */
      }

      qc.invalidateQueries({
        queryKey: ["hackathons", "tasks", taskId, "submissions"],
      });
    };

    source.addEventListener("hackathon.leaderboard.updated", handleUpdate);

    return () => {
      source.removeEventListener("hackathon.leaderboard.updated", handleUpdate);
      source.close();
    };
  }, [enabled, qc, taskId]);
}



export function useCancelSubmission(taskId: string) {
  const qc = useQueryClient();
  return useMutation<HackathonSubmission, Error, string>({
    mutationFn: (submissionId: string) =>
      apiPost<HackathonSubmission>(
        `/api/v1/hackathons/submissions/${submissionId}/cancel`,
        {},
        HackathonSubmissionSchema
      ),
    onSuccess: () => {
      qc.invalidateQueries({
        queryKey: ["hackathons", "tasks", taskId, "submissions"],
      });
    },
  });
}

export function useSubmissionLogs(submissionId: string, options?: any) {
  return useQuery<{ logs: string | null }>({
    queryKey: ["submissions", submissionId, "logs"],
    queryFn: () =>
      apiGet<{ logs: string | null }>(
        `/api/v1/hackathons/submissions/${submissionId}/logs`
      ),
    staleTime: 30_000,
    enabled: !!submissionId,
    ...options,
  });
}

