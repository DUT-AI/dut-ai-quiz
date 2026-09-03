import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiClient } from "@/lib/api";
import { Comment, CommentCreate, PaginatedCommentsResponse, SortMode, TargetType } from "./types";
import { z } from "zod";

// Zod schema validation to match the apiJson/apiGet/apiPost expectations if schemas are used.
// We can define lenient schema or validate properly.
const CommentSchema: z.ZodType<Comment> = z.lazy(() =>
  z.object({
    id: z.string(),
    target_type: z.enum(["lesson_qna", "system_feedback"]),
    target_id: z.string().nullable().optional(),
    parent_id: z.string().nullable().optional(),
    user_id: z.number(),
    user_name: z.string().nullable().optional(),
    user_avatar: z.string().nullable().optional(),
    user_role: z.string().nullable().optional(),
    content: z.string(),
    image_urls: z.array(z.string()).default([]),
    like_count: z.number(),
    dislike_count: z.number(),
    created_at: z.string(),
    updated_at: z.string(),
    replies: z.array(CommentSchema).default([]),
  })
);

const PaginatedCommentsResponseSchema = z.object({
  data: z.array(CommentSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
});

export function useComments(
  targetType: TargetType,
  targetId?: string | null,
  sortBy: SortMode = "best",
  limit = 20,
  offset = 0
) {
  const queryParams = new URLSearchParams();
  queryParams.append("target_type", targetType);
  if (targetId) queryParams.append("target_id", targetId);
  queryParams.append("sort_by", sortBy);
  queryParams.append("limit", String(limit));
  queryParams.append("offset", String(offset));

  return useQuery<PaginatedCommentsResponse>({
    queryKey: ["comments", targetType, targetId, sortBy, limit, offset],
    queryFn: () =>
      apiGet<PaginatedCommentsResponse>(
        `/api/v1/comments?${queryParams.toString()}`,
        PaginatedCommentsResponseSchema
      ),
    staleTime: 10_000, // 10 seconds stale time
  });
}

export function useCreateComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CommentCreate) =>
      apiPost<Comment>("/api/v1/comments", body, CommentSchema),
    onSuccess: (_, variables) => {
      // Invalidate the list query for the specific target
      qc.invalidateQueries({
        queryKey: ["comments", variables.target_type, variables.target_id],
      });
    },
  });
}

export function useToggleReaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
      reactionType,
    }: {
      commentId: string;
      reactionType: "like" | "dislike";
      targetType: TargetType;
      targetId?: string | null;
    }) =>
      apiClient
        .post(`/api/v1/comments/${commentId}/reactions`, {
          reaction_type: reactionType,
        })
        .then((r) => r.data),
    onSuccess: (_, variables) => {
      // Invalidate comments tree to reflect updated reaction count
      qc.invalidateQueries({
        queryKey: ["comments", variables.targetType, variables.targetId],
      });
    },
  });
}

export function useDeleteComment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      commentId,
    }: {
      commentId: string;
      targetType: TargetType;
      targetId?: string | null;
    }) =>
      apiClient.delete(`/api/v1/comments/${commentId}`).then((r) => r.data),
    onSuccess: (_, variables) => {
      // Invalidate list
      qc.invalidateQueries({
        queryKey: ["comments", variables.targetType, variables.targetId],
      });
    },
  });
}
