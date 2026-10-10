"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { HomeworkRubric } from "../types";
import { cn } from "@/lib/utils";

interface HomeworkRubricCardProps {
  rubric: HomeworkRubric;
  onRetry: () => void;
  isRetrying: boolean;
  isProcessing: boolean;
}

export function HomeworkRubricCard({
  rubric,
  onRetry,
  isRetrying,
  isProcessing,
}: HomeworkRubricCardProps) {
  const totalWeight = rubric.criteria.reduce((s, c) => s + (c.weight || 0), 0);

  return (
    <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
        <h3 className="text-lg font-black text-dark-blue dark:text-white flex items-center gap-2">
          <Sparkles className="size-5 text-primary" />
          Tiêu chí chấm tự động AI (Grading Rubric)
        </h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRetry}
          disabled={isRetrying || isProcessing}
          className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCw
            className={cn("size-3.5", (isRetrying || isProcessing) && "animate-spin")}
          />
          <span>Tạo lại</span>
        </Button>
      </div>

      {rubric.objective && (
        <div className="p-3.5 rounded-2xl bg-primary/5 border border-primary/15 text-xs text-dark-blue dark:text-light-blue leading-relaxed">
          <span className="font-black text-primary uppercase text-[10px] tracking-wider block mb-1">
            Mục tiêu đánh giá:
          </span>
          {rubric.objective}
        </div>
      )}

      {rubric.criteria && rubric.criteria.length > 0 ? (
        <div className="space-y-3 pt-2">
          <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
            Danh sách tiêu chí ({rubric.criteria.length} tiêu chí - Tổng {totalWeight} điểm)
          </p>
          <div className="divide-y divide-gray-100 dark:divide-white/5 border border-gray-150 dark:border-white/10 rounded-2xl overflow-hidden">
            {rubric.criteria.map((c, idx) => (
              <div
                key={c.id || idx}
                className="p-4 bg-gray-50/50 dark:bg-white/[0.02] hover:bg-gray-50 dark:hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-gray-200 dark:bg-white/10 text-gray-800 dark:text-gray-200">
                        #{c.id}
                      </span>
                      <h4 className="text-sm font-bold text-dark-blue dark:text-white">
                        {c.criterion}
                      </h4>
                    </div>
                    <p className="text-xs text-gray-navy/80 dark:text-light-blue/70 leading-relaxed pt-1">
                      {c.description}
                    </p>
                  </div>
                  <span className="shrink-0 px-2.5 py-1 rounded-xl bg-primary/10 text-primary text-xs font-black">
                    +{c.weight}đ
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-navy/60 italic py-2">
          Chưa có danh sách tiêu chí chi tiết.
        </p>
      )}

      {/* Requirements / Allowed / Forbidden libraries */}
      {(rubric.required_files?.length > 0 || rubric.allowed_libraries?.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
          {rubric.required_files?.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 space-y-1">
              <span className="font-bold text-gray-navy dark:text-light-blue text-[11px] uppercase">
                Tệp bắt buộc:
              </span>
              <div className="flex flex-wrap gap-1">
                {rubric.required_files.map((f, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-white dark:bg-black/30 px-2 py-0.5 rounded border border-gray-200 dark:border-white/10"
                  >
                    {f}
                  </span>
                ))}
              </div>
            </div>
          )}
          {rubric.allowed_libraries?.length > 0 && (
            <div className="p-3 rounded-xl bg-gray-100 dark:bg-white/5 space-y-1">
              <span className="font-bold text-gray-navy dark:text-light-blue text-[11px] uppercase">
                Thư viện cho phép:
              </span>
              <div className="flex flex-wrap gap-1">
                {rubric.allowed_libraries.map((lib, i) => (
                  <span
                    key={i}
                    className="font-mono text-[11px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20"
                  >
                    {lib}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
