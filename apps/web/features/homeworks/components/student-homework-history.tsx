"use client";

import React, { useState, useMemo, useEffect } from "react";
import { ChevronLeft, ChevronRight, History, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HomeworkSubmission } from "../types";
import { SubmissionResult } from "./submission-result";

interface StudentHomeworkHistoryProps {
  submissions: HomeworkSubmission[];
  latestSubmissionId?: string;
  onRetry: () => void | Promise<void>;
  isRetrying: boolean;
  pageSize?: number;
}

export function StudentHomeworkHistory({
  submissions,
  latestSubmissionId,
  onRetry,
  isRetrying,
  pageSize = 3,
}: StudentHomeworkHistoryProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Automatically reset to page 1 when the latest submission changes
  const latestId = submissions[0]?.id;
  useEffect(() => {
    setCurrentPage(1);
  }, [latestId]);

  const totalPages = Math.max(1, Math.ceil(submissions.length / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);

  const paginatedSubmissions = useMemo(() => {
    const startIndex = (validCurrentPage - 1) * pageSize;
    return submissions.slice(startIndex, startIndex + pageSize);
  }, [submissions, validCurrentPage, pageSize]);

  if (submissions.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-gray-navy dark:text-light-blue/70">
          <History className="size-3.5 text-primary" />
          Tất cả kết quả đánh giá ({submissions.length} lần nộp bài)
        </h4>
        {totalPages > 1 && (
          <Badge
            variant="outline"
            className="border-gray-200 dark:border-white/10 text-xs font-semibold text-gray-navy dark:text-light-blue"
          >
            Trang {validCurrentPage} / {totalPages}
          </Badge>
        )}
      </div>

      {/* Submissions list for current page */}
      <div className="space-y-4">
        {paginatedSubmissions.map((sub) => (
          <div key={sub.id} className="space-y-2">
            <SubmissionResult submission={sub} />

            {sub.status === "FAILED" && sub.id === latestSubmissionId && (
              <Button
                type="button"
                variant="outline"
                disabled={isRetrying}
                onClick={onRetry}
                className="w-full sm:w-auto border-amber-500/40 text-amber-700 hover:bg-amber-500/10 dark:text-amber-300 font-semibold rounded-xl"
              >
                <RefreshCcw className={`mr-2 size-4 ${isRetrying ? "animate-spin" : ""}`} />
                {isRetrying ? "Đang gửi yêu cầu..." : "Thử chấm lại với file cũ"}
              </Button>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <Card className="border border-gray-150 bg-white dark:border-white/10 dark:bg-navy-blue/30 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-navy dark:text-light-blue/70">
            <div>
              Hiển thị lần nộp{" "}
              <strong className="text-dark-blue dark:text-white">
                {(validCurrentPage - 1) * pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-dark-blue dark:text-white">
                {Math.min(validCurrentPage * pageSize, submissions.length)}
              </strong>{" "}
              trên tổng số <strong className="text-primary">{submissions.length}</strong> lần nộp bài
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={validCurrentPage === 1}
                className="h-8 w-8 p-0 rounded-lg border-gray-200 dark:border-white/10"
                aria-label="Trang trước"
              >
                <ChevronLeft className="size-4" />
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                  <Button
                    key={pageNum}
                    variant={pageNum === validCurrentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNum)}
                    className={`h-8 min-w-8 px-2 rounded-lg text-xs font-bold transition-all ${
                      pageNum === validCurrentPage
                        ? "bg-primary text-white shadow-sm shadow-primary/20"
                        : "border-gray-200 dark:border-white/10 text-gray-700 hover:bg-gray-100 dark:text-light-blue dark:hover:bg-white/5"
                    }`}
                  >
                    {pageNum}
                  </Button>
                ))}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={validCurrentPage === totalPages}
                className="h-8 w-8 p-0 rounded-lg border-gray-200 dark:border-white/10"
                aria-label="Trang tiếp theo"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
