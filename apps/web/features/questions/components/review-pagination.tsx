import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ReviewPaginationProps {
  page: number;
  isPrevDisabled: boolean;
  isNextDisabled: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function ReviewPagination({
  page,
  isPrevDisabled,
  isNextDisabled,
  onPrev,
  onNext,
}: ReviewPaginationProps) {
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100 dark:border-white/5">
      <div className="bg-slate-50 dark:bg-zinc-800/40 border border-slate-200/50 dark:border-white/5 rounded-2xl px-4 py-2 text-xs font-black text-slate-500 dark:text-slate-400 tracking-wider">
        TRANG {page}
      </div>
      
      <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
        <Button
          onClick={onPrev}
          disabled={isPrevDisabled}
          variant="outline"
          className="flex-1 sm:flex-none h-11 px-5 rounded-2xl flex items-center justify-center gap-1 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-black text-xs disabled:opacity-50"
        >
          <ChevronLeft className="size-4" /> Trang trước
        </Button>
        <Button
          onClick={onNext}
          disabled={isNextDisabled}
          variant="outline"
          className="flex-1 sm:flex-none h-11 px-5 rounded-2xl flex items-center justify-center gap-1 border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-white/5 font-black text-xs disabled:opacity-50"
        >
          Trang sau <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
