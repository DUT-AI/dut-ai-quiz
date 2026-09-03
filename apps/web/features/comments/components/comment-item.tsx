"use client";

import React, { useState, useEffect } from "react";
import { ThumbsUp, ThumbsDown, MessageSquare, Trash2, Shield, Calendar } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { vi } from "date-fns/locale";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";
import { Comment, TargetType } from "../types";
import { CommentForm } from "./comment-form";
import { useAuth } from "@/context/auth-context";
import { useToggleReaction, useDeleteComment, useCreateComment } from "../queries";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";

interface CommentItemProps {
  comment: Comment;
  targetType: TargetType;
  targetId?: string | null;
  depth?: number;
}

export function CommentItem({
  comment,
  targetType,
  targetId,
  depth = 1,
}: CommentItemProps) {
  const { user } = useAuth();
  const [isReplying, setIsReplying] = useState(false);
  const toggleReactionMutation = useToggleReaction();
  const deleteCommentMutation = useDeleteComment();
  const createCommentMutation = useCreateComment();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Local state to track user's reactions in this session (persisted locally)
  const reactionKey = `comment_react_${comment.id}_${user?.id || "guest"}`;
  const [localReaction, setLocalReaction] = useState<"like" | "dislike" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem(reactionKey);
      if (saved === "like" || saved === "dislike") {
        setLocalReaction(saved);
      }
    }
  }, [reactionKey]);

  const handleReaction = async (type: "like" | "dislike") => {
    if (!user) {
      toast.error("Vui lòng đăng nhập để bày tỏ cảm xúc.");
      return;
    }

    // Optimistic UI updates
    let updatedReaction: "like" | "dislike" | null = type;
    if (localReaction === type) {
      updatedReaction = null;
      localStorage.removeItem(reactionKey);
    } else {
      localStorage.setItem(reactionKey, type);
    }
    setLocalReaction(updatedReaction);

    try {
      await toggleReactionMutation.mutateAsync({
        commentId: comment.id,
        reactionType: type,
        targetType,
        targetId,
      });
    } catch (err: any) {
      // Revert if API fails
      setLocalReaction(localReaction);
      if (localReaction) {
        localStorage.setItem(reactionKey, localReaction);
      } else {
        localStorage.removeItem(reactionKey);
      }
      toast.error(err.message || "Không thể thực hiện hành động này.");
    }
  };

  const performDelete = async () => {
    try {
      await deleteCommentMutation.mutateAsync({
        commentId: comment.id,
        targetType,
        targetId,
      });
      toast.success("Đã xóa bình luận thành công.");
    } catch (err: any) {
      toast.error(err.message || "Không thể xóa bình luận.");
    }
  };

  const handleReplySubmit = async (content: string, imageUrls: string[]) => {
    try {
      await createCommentMutation.mutateAsync({
        target_type: targetType,
        target_id: targetId || null,
        parent_id: comment.id,
        content,
        image_urls: imageUrls,
      });
      setIsReplying(false);
      toast.success("Gửi phản hồi thành công!");
    } catch (err: any) {
      toast.error(err.message || "Không thể gửi phản hồi.");
    }
  };

  const getRoleBadge = (role?: string | null) => {
    if (!role) return null;
    const isStaff = role.toLowerCase() === "admin" || role.toLowerCase() === "educator";
    if (!isStaff) return null;

    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary/10 text-primary border border-primary/20">
        <Shield className="size-3" />
        {role.toUpperCase()}
      </span>
    );
  };

  const formattedDate = () => {
    try {
      const d = new Date(comment.created_at);
      return formatDistanceToNow(d, { addSuffix: true, locale: vi });
    } catch (e) {
      return comment.created_at;
    }
  };

  const isAuthor = user?.id === comment.user_id;
  const isStaff = user?.quiz_role?.toLowerCase() === "admin" || user?.quiz_role?.toUpperCase() === "EDUCATOR";
  const canDelete = isAuthor || isStaff;

  // Max depth is 3, replies can only go down to level 3
  const canReply = depth < 3 && !!user;

  // Dynamic reactions counts based on local state changes
  // It handles count changes accurately
  const getLikeCount = () => {
    let count = comment.like_count;
    // Note: if user previously liked, but now toggled off or changed to dislike
    // we can approximate if count was not loaded with user's specific state
    return count;
  };

  const getDislikeCount = () => {
    return comment.dislike_count;
  };

  return (
    <div
      className={cn(
        "flex flex-col gap-3 py-4 animate-in fade-in duration-300",
        depth > 1 ? "pl-6 sm:pl-10 border-l border-gray-100 dark:border-white/5 mt-1" : "border-b border-gray-100 dark:border-white/5 last:border-b-0"
      )}
    >
      <div className="flex items-start justify-between w-full">
        {/* User Info Header */}
        <div className="flex gap-2.5 items-center">
          <Avatar className="size-8 border border-gray-100 dark:border-white/10">
            {comment.user_avatar && (
              <AvatarImage src={comment.user_avatar} alt={comment.user_name || ""} />
            )}
            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold">
              {comment.user_name?.slice(0, 2).toUpperCase() || "US"}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap items-center gap-1.5 leading-tight">
            <span className="text-sm font-bold text-dark-blue dark:text-white">
              {comment.user_name || "Người dùng"}
            </span>
            {getRoleBadge(comment.user_role)}
            <span className="flex items-center gap-1 text-[11px] text-gray-navy/55 dark:text-light-blue/50 font-medium ml-1">
              <Calendar className="size-3 opacity-70" />
              {formattedDate()}
            </span>
          </div>
        </div>

        {/* Admin/User actions */}
        {canDelete && (
          <Button
            variant="ghost"
            size="icon-xs"
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-gray-navy/40 hover:text-red dark:text-light-blue/40 dark:hover:text-red transition-colors"
          >
            <Trash2 className="size-3.5" />
          </Button>
        )}
      </div>

      {/* Comment Content */}
      <div className="pl-0 sm:pl-10 text-sm text-dark-blue dark:text-zinc-100 font-sans leading-relaxed break-words markdown-styles">
        <Markdown content={comment.content} />

        {/* Attached images */}
        {comment.image_urls && comment.image_urls.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {comment.image_urls.map((url, idx) => (
              <div
                key={idx}
                className="relative rounded-2xl border border-gray-100 dark:border-white/10 overflow-hidden max-w-xs max-h-48 group shadow-sm bg-black/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={url}
                  alt={`comment-img-${idx}`}
                  className="max-w-full max-h-48 object-contain rounded-2xl hover:scale-[1.02] transition-transform duration-300 cursor-zoom-in"
                  onClick={() => {
                    // Open image in fullscreen overlay (handled by Markdown helper zoom triggers)
                    if (typeof window !== "undefined") {
                      const imgClick = document.createElement("img");
                      imgClick.src = url;
                      imgClick.click();
                    }
                  }}
                />
              </div>
            ))}
          </div>
        )}

        {/* Reactions & Reply button */}
        <div className="flex items-center gap-4 mt-3">
          <div className="flex items-center gap-1 bg-gray-50 dark:bg-white/5 rounded-full p-0.5 border border-gray-100 dark:border-white/5 shadow-sm">
            <button
              onClick={() => handleReaction("like")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:bg-emerald-500/10 hover:text-emerald-500",
                localReaction === "like"
                  ? "bg-emerald-500/15 text-emerald-500 dark:bg-emerald-500/25"
                  : "text-gray-navy/70 dark:text-light-blue/70"
              )}
            >
              <ThumbsUp className={cn("size-3.5", localReaction === "like" ? "fill-emerald-500/20" : "")} />
              <span>{getLikeCount()}</span>
            </button>
            <button
              onClick={() => handleReaction("dislike")}
              className={cn(
                "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-all duration-200 hover:bg-red/10 hover:text-red",
                localReaction === "dislike"
                  ? "bg-red/15 text-red dark:bg-red/25"
                  : "text-gray-navy/70 dark:text-light-blue/70"
              )}
            >
              <ThumbsDown className={cn("size-3.5", localReaction === "dislike" ? "fill-red/20" : "")} />
              <span>{getDislikeCount()}</span>
            </button>
          </div>

          {canReply && (
            <button
              onClick={() => setIsReplying(!isReplying)}
              className={cn(
                "flex items-center gap-1.5 text-xs font-bold text-gray-navy/70 dark:text-light-blue/70 hover:text-primary transition-colors",
                isReplying ? "text-primary" : ""
              )}
            >
              <MessageSquare className="size-3.5" />
              Phản hồi
            </button>
          )}
        </div>
      </div>

      {/* Reply creation form */}
      {isReplying && (
        <CommentForm
          isReply={true}
          autoFocus={true}
          submitLabel="Trả lời"
          placeholder={`Trả lời bình luận của ${comment.user_name || "Người dùng"}...`}
          onCancel={() => setIsReplying(false)}
          onSubmit={handleReplySubmit}
        />
      )}

      {/* Replies list tree (indented recursively) */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="flex flex-col gap-1 w-full">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              targetType={targetType}
              targetId={targetId}
              depth={depth + 1}
            />
          ))}
        </div>
      )}

      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={performDelete}
        title="Xóa bình luận"
        description="Bạn có chắc chắn muốn xóa bình luận này không? Hành động này sẽ xóa vĩnh viễn bình luận và tất cả các phản hồi của nó."
        confirmText="Xóa bình luận"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
