"use client";

import { BookOpenCheck, Edit3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Markdown } from "@/components/markdown";

interface HomeworkDescriptionCardProps {
  description: string;
  onEdit: () => void;
}

export function HomeworkDescriptionCard({ description, onEdit }: HomeworkDescriptionCardProps) {
  return (
    <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
        <h3 className="text-lg font-black text-dark-blue dark:text-white flex items-center gap-2">
          <BookOpenCheck className="size-5 text-primary" />
          Mô tả / Đề bài chi tiết
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onEdit}
          className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl"
        >
          <Edit3 className="size-3.5 mr-1" />
          Chỉnh sửa đề bài
        </Button>
      </div>

      {description ? (
        <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words">
          <Markdown content={description} />
        </div>
      ) : (
        <div className="py-10 text-center text-gray-navy/60 dark:text-light-blue/50 italic text-sm">
          Chưa có nội dung mô tả chi tiết cho bài tập này.
        </div>
      )}
    </div>
  );
}
