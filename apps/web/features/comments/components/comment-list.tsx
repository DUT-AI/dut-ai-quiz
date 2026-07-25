"use client";

import React, { useState } from "react";
import { MessageSquare, RefreshCw, AlertCircle, ArrowUpDown } from "lucide-react";
import { useComments, useCreateComment } from "../queries";
import { CommentForm } from "./comment-form";
import { CommentItem } from "./comment-item";
import { TargetType, SortMode } from "../types";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface CommentListProps {
  targetType: TargetType;
  targetId?: string | null;
  title?: string;
  description?: string;
  showIcon?: boolean;
  onSuccess?: () => void;
}

export function CommentList({
  targetType,
  targetId,
  title,
  description,
  showIcon = false,
  onSuccess,
}: CommentListProps) {
  const [sortBy, setSortBy] = useState<SortMode>("best");
  const [limit, setLimit] = useState(15);
  const { data, isLoading, error, refetch, isFetching } = useComments(
    targetType,
    targetId,
    sortBy,
    limit,
    0
  );
  const createCommentMutation = useCreateComment();

  const handleCreateComment = async (content: string, imageUrls: string[]) => {
    try {
      await createCommentMutation.mutateAsync({
        target_type: targetType,
        target_id: targetId || null,
        content,
        image_urls: imageUrls,
      });
      toast.success("Bình luận của bạn đã được đăng!");
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Không thể đăng bình luận.");
    }
  };

  const hasMore = data ? data.total > (data.data?.length || 0) : false;

  const handleLoadMore = () => {
    setLimit((prev) => prev + 15);
  };

  return (
    <div className="w-full space-y-6 text-left">
      {/* Header section with title, count, and sorting */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-gray-150 dark:border-white/10 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            {showIcon && (
              <div className="size-8 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                <MessageSquare className="size-4.5" />
              </div>
            )}
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {title ? `${title} (${data?.total ?? 0})` : `Thảo luận (${data?.total ?? 0})`}
            </h2>
          </div>
          {description && (
            <p className="text-xs sm:text-sm text-gray-navy/70 dark:text-light-blue/60 mt-0.5">
              {description}
            </p>
          )}
        </div>

        {/* Sort controls */}
        <div className="flex items-center gap-1.5 text-xs text-gray-navy/70 dark:text-light-blue/70 self-start sm:self-auto shrink-0">
          <ArrowUpDown className="size-3.5" />
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortMode)}
            className="bg-transparent font-bold hover:text-primary focus:outline-none cursor-pointer pr-1 transition-colors"
          >
            <option value="best" className="bg-white dark:bg-[#1A263B] text-dark-blue dark:text-white">
              Tốt nhất
            </option>
            <option value="new" className="bg-white dark:bg-[#1A263B] text-dark-blue dark:text-white">
              Mới nhất
            </option>
            <option value="old" className="bg-white dark:bg-[#1A263B] text-dark-blue dark:text-white">
              Cũ nhất
            </option>
          </select>
        </div>
      </div>

      {/* Main Comment input box */}
      <CommentForm onSubmit={handleCreateComment} placeholder="Đặt câu hỏi hoặc chia sẻ cảm nghĩ của bạn tại đây..." />

      {/* Errors display */}
      {error && (
        <div className="p-4 border border-red/10 rounded-2xl bg-red/5 flex items-center justify-between">
          <div className="flex items-center gap-2 text-red text-sm font-semibold">
            <AlertCircle className="size-4" />
            <span>Không thể tải bình luận. Vui lòng tải lại trang.</span>
          </div>
          <Button variant="ghost" size="sm" onClick={() => refetch()} className="h-7 text-xs text-red font-bold">
            <RefreshCw className="size-3.5 mr-1" /> Thử lại
          </Button>
        </div>
      )}

      {/* Loading state skeleton */}
      {isLoading && !data && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3 animate-pulse py-4 border-b border-gray-55 dark:border-white/5 last:border-b-0">
              <div className="size-8 rounded-full bg-gray-200 dark:bg-white/10" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-1/4 rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-3 w-3/4 rounded bg-gray-200 dark:bg-white/10" />
                <div className="h-3 w-1/2 rounded bg-gray-200 dark:bg-white/10" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {data && data.total === 0 && (
        <div className="py-10 text-center flex flex-col items-center justify-center gap-2">
          <p className="text-sm font-bold text-gray-navy/50 dark:text-light-blue/40">
            Chưa có thảo luận nào ở đây.
          </p>
          <p className="text-xs text-gray-navy/40 dark:text-light-blue/30 max-w-xs">
            Hãy là người đầu tiên đặt câu hỏi hoặc gửi phản hồi của bạn!
          </p>
        </div>
      )}

      {/* Comments List */}
      {data && data.data && data.data.length > 0 && (
        <div className="space-y-1">
          {data.data.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              targetType={targetType}
              targetId={targetId}
            />
          ))}
        </div>
      )}

      {/* Load More Button */}
      {hasMore && (
        <div className="flex justify-center pt-4">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            disabled={isFetching}
            className="rounded-2xl px-6 border-gray-200 dark:border-white/10 text-gray-navy dark:text-light-blue font-bold text-xs shadow-sm hover:border-primary/50"
          >
            {isFetching ? (
              <>
                <RefreshCw className="size-3 mr-1.5 animate-spin text-primary" />
                Đang tải...
              </>
            ) : (
              "Xem thêm bình luận"
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
