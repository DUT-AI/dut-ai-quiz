export type TargetType = "lesson_qna" | "system_feedback";

export type ReactionType = "like" | "dislike";

export type SortMode = "best" | "top_likes" | "top_dislikes" | "new" | "old";

export interface Comment {
  id: string;
  target_type: TargetType;
  target_id?: string | null;
  parent_id?: string | null;
  user_id: number;
  user_name?: string | null;
  user_avatar?: string | null;
  user_role?: string | null;
  content: string;
  image_urls: string[];
  like_count: number;
  dislike_count: number;
  created_at: string;
  updated_at: string;
  replies: Comment[];
}

export interface PaginatedCommentsResponse {
  data: Comment[];
  total: number;
  limit: number;
  offset: number;
}

export interface CommentCreate {
  target_type: TargetType;
  target_id?: string | null;
  parent_id?: string | null;
  content: string;
  image_urls?: string[];
}
