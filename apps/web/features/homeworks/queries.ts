"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";

import { apiClient, apiFetch, apiGet, apiPost } from "@/lib/api";
import {
  HomeworkFormValues,
  HomeworkSchema,
  HomeworkSubmission,
  HomeworkSubmissionSchema,
} from "./types";

const listResponse = z.object({
  data: z.array(HomeworkSchema),
  is_success: z.boolean(),
});
const submissionListResponse = z.object({
  data: z.array(HomeworkSubmissionSchema),
  is_success: z.boolean(),
});
type HomeworkListResponse = z.infer<typeof listResponse>;
type HomeworkSubmissionListResponse = z.infer<typeof submissionListResponse>;

async function formRequest<T>(
  path: string,
  method: "POST" | "PATCH",
  form: FormData,
  schema: z.ZodType<T>,
): Promise<T> {
  const response = await apiFetch(path, { method, body: form });
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.detail || body?.message || `HTTP ${response.status}`);
  }
  return schema.parse(await response.json());
}

function homeworkForm(values: HomeworkFormValues): FormData {
  const form = new FormData();
  form.append("lesson_id", values.lessonId);
  form.append("title", values.title);
  form.append("description", values.description);
  if (values.file) form.append("file", values.file);
  return form;
}

export function useMyHomeworks(lessonId: string | null) {
  return useQuery({
    queryKey: ["homeworks", "me", lessonId],
    queryFn: () =>
      apiGet<HomeworkListResponse>(
        `/api/v1/homeworks/me?lesson_id=${lessonId}`,
        listResponse,
      ),
    enabled: !!lessonId,
    refetchInterval: (query) =>
      query.state.data?.data.some(
        (homework) => homework.current_submission?.status === "GRADING",
      )
        ? 5000
        : false,
  });
}

export function useHomeworks() {
  return useQuery({
    queryKey: ["homeworks"],
    queryFn: () => apiGet<HomeworkListResponse>("/api/v1/homeworks", listResponse),
  });
}

export function useHomeworkSubmissions(homeworkId: string | null) {
  return useQuery({
    queryKey: ["homeworks", homeworkId, "submissions"],
    queryFn: () =>
      apiGet<HomeworkSubmissionListResponse>(
        `/api/v1/homeworks/${homeworkId}/submissions`,
        submissionListResponse,
      ),
    enabled: !!homeworkId,
    refetchInterval: (query) =>
      query.state.data?.data.some((item) => item.status === "GRADING")
        ? 5000
        : false,
  });
}

export function useCreateHomework() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (values: HomeworkFormValues) =>
      formRequest(
        "/api/v1/homeworks",
        "POST",
        homeworkForm(values),
        z.object({ data: HomeworkSchema, is_success: z.boolean() }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["homeworks"] }),
  });
}

export function useUpdateHomework() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: HomeworkFormValues;
    }) =>
      formRequest(
        `/api/v1/homeworks/${id}`,
        "PATCH",
        homeworkForm(values),
        z.object({ data: HomeworkSchema, is_success: z.boolean() }),
      ),
    onSuccess: () => client.invalidateQueries({ queryKey: ["homeworks"] }),
  });
}

export function useArchiveHomework() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const response = await apiFetch(`/api/v1/homeworks/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Không thể lưu trữ bài tập");
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["homeworks"] }),
  });
}

export function useSubmitHomework() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async ({
      homeworkId,
      file,
    }: {
      homeworkId: string;
      file: File;
    }) => {
      // 1. Request presigned upload URL from backend
      const presignRes = await apiPost<{
        data: {
          upload_url: string;
          object_key: string;
          original_filename: string;
        };
        is_success: boolean;
      }>(
        `/api/v1/homeworks/${homeworkId}/submissions/presign`,
        {
          filename: file.name,
          content_type: file.type || "application/octet-stream",
        },
        z.object({
          data: z.object({
            upload_url: z.string(),
            object_key: z.string(),
            original_filename: z.string(),
          }),
          is_success: z.boolean(),
        }),
      );

      // 2. Upload file directly to S3 / MinIO (non-blocking, client-to-storage)
      await apiClient.put(presignRes.data.upload_url, file, {
        headers: { "Content-Type": file.type || "application/octet-stream" },
        withCredentials: false,
        baseURL: "",
      });

      // 3. Commit submission to backend API
      return apiPost<{
        data: HomeworkSubmission;
        is_success: boolean;
      }>(
        `/api/v1/homeworks/${homeworkId}/submissions`,
        {
          object_key: presignRes.data.object_key,
          original_filename: presignRes.data.original_filename,
        },
        z.object({
          data: HomeworkSubmissionSchema,
          is_success: z.boolean(),
        }),
      );
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["homeworks"] }),
  });
}

export function useRetryHomeworkSubmission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: async (submissionId: string) => {
      const response = await apiFetch(
        `/api/v1/homeworks/submissions/${submissionId}/retry`,
        { method: "POST" },
      );
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.detail || body?.message || `HTTP ${response.status}`);
      }
      return z.object({
        data: HomeworkSubmissionSchema,
        is_success: z.boolean(),
      }).parse(await response.json());
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ["homeworks"] }),
  });
}

export async function openHomeworkAttachment(homeworkId: string) {
  const response = await apiGet<{ data: { url: string } }>(
    `/api/v1/homeworks/${homeworkId}/attachment-url`,
    z.object({ data: z.object({ url: z.string().url() }) }),
  );
  window.open(response.data.url, "_blank", "noopener,noreferrer");
}

export async function openSubmissionFile(submissionId: string) {
  const response = await apiGet<{ data: { url: string } }>(
    `/api/v1/homeworks/submissions/${submissionId}/download-url`,
    z.object({ data: z.object({ url: z.string().url() }) }),
  );
  window.open(response.data.url, "_blank", "noopener,noreferrer");
}
