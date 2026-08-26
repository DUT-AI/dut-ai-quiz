"use client";

import React from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import { useCheckRelatedQuestions } from "@/lib/queries";

interface Props {
  content: string;
  poolType?: string;
}

export function LiveDuplicateChecker({ content, poolType }: Props) {
  const { data: related = [], isLoading } = useCheckRelatedQuestions({
    content,
    pool_type: poolType,
    enabled: content.trim().length >= 10,
  });

  // Find duplicates with similarity score >= 0.85
  const duplicate = related.find((r) => r.score >= 0.85);

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-2">
        <Loader2 className="size-3 animate-spin text-slate-400" />
        <span>Đang quét trùng lặp...</span>
      </div>
    );
  }

  if (duplicate) {
    return (
      <div className="mt-2 text-xs bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-xl p-3 text-amber-700 dark:text-amber-400 flex items-start gap-2 animate-in fade-in duration-200">
        <AlertTriangle className="size-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Cảnh báo trùng lặp ({Math.round(duplicate.score * 100)}%):</p>
          <p className="line-clamp-2 italic text-slate-600 dark:text-slate-400 mt-0.5">
            "{duplicate.content}"
          </p>
        </div>
      </div>
    );
  }

  return null;
}
