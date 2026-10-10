"use client";

import { useState, useMemo } from "react";
import { Search, Inbox } from "lucide-react";
import { toast } from "sonner";
import { Homework, HomeworkSubmission } from "../types";
import { FilterDropdown } from "@/components/ui/filter-dropdown";
import { useRetryHomeworkSubmission } from "../queries";
import { GroupedSubmission } from "./submissions/types";
import { DesktopSubmissionRow } from "./submissions/desktop-submission-row";
import { MobileSubmissionCard } from "./submissions/mobile-submission-card";

interface SubmissionsListProps {
  homework: Homework;
  submissions: HomeworkSubmission[];
  isLoading: boolean;
}

export function SubmissionsList({
  homework,
  submissions,
  isLoading,
}: SubmissionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [plagiarismFilter, setPlagiarismFilter] = useState<string>("ALL");
  const [retryingId, setRetryingId] = useState<string | null>(null);

  const retry = useRetryHomeworkSubmission();

  const handleRetry = async (submissionId: string) => {
    if (retryingId) return;
    setRetryingId(submissionId);
    try {
      await retry.mutateAsync(submissionId);
      toast.success("Đã gửi yêu cầu chấm lại bài nộp cho AI worker");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Chấm lại bài thất bại");
    } finally {
      setRetryingId(null);
    }
  };

  // Filters logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch =
        sub.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Thành viên #${sub.user_id}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;

      const matchesPlagiarized =
        plagiarismFilter === "ALL" ||
        (plagiarismFilter === "PLAGIARIZED" && sub.is_plagiarized) ||
        (plagiarismFilter === "CLEAN" && !sub.is_plagiarized);

      return matchesSearch && matchesStatus && matchesPlagiarized;
    });
  }, [submissions, searchQuery, statusFilter, plagiarismFilter]);

  const isFilterActive = useMemo(() => {
    return searchQuery !== "" || statusFilter !== "ALL" || plagiarismFilter !== "ALL";
  }, [searchQuery, statusFilter, plagiarismFilter]);

  const groupedSubmissions = useMemo((): GroupedSubmission[] => {
    if (isFilterActive) return [];

    const groups: { [key: number]: HomeworkSubmission[] } = {};
    submissions.forEach((sub) => {
      const subWithOwnerName = {
        ...sub,
        owner_name: sub.owner_name || `Thành viên #${sub.user_id}`,
      };
      if (!groups[sub.user_id]) {
        groups[sub.user_id] = [];
      }
      groups[sub.user_id].push(subWithOwnerName);
    });

    return Object.entries(groups)
      .map(([userId, subs]) => {
        const sortedSubs = [...subs].sort((a, b) => b.attempt_number - a.attempt_number);
        return {
          userId: Number(userId),
          owner_name: sortedSubs[0].owner_name,
          submissions: sortedSubs,
          latestSubmission: sortedSubs[0],
        };
      })
      .sort(
        (a, b) =>
          new Date(b.latestSubmission.submitted_at).getTime() -
          new Date(a.latestSubmission.submitted_at).getTime()
      );
  }, [submissions, isFilterActive]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-gray-150 rounded-2xl bg-white/50 dark:border-white/10 dark:bg-zinc-900/40">
        <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
        <p className="mt-2 text-xs text-gray-navy dark:text-light-blue/70 animate-pulse font-semibold">
          Đang tải danh sách bài nộp...
        </p>
      </div>
    );
  }

  const isEmpty = isFilterActive
    ? filteredSubmissions.length === 0
    : groupedSubmissions.length === 0;

  return (
    <div className="space-y-6">
      {/* Search & Filters Controls */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên học viên..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-250 bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900 dark:text-white"
            />
          </div>

          {/* Filters Selects Grid */}
          <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
            <FilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
              options={[
                { value: "ALL", label: "Tất cả trạng thái" },
                { value: "GRADED", label: "Đã chấm điểm" },
                { value: "GRADING", label: "Đang chấm" },
                { value: "UPLOADED", label: "Đã tải lên" },
                { value: "FAILED", label: "Chấm lỗi" },
              ]}
            />

            <FilterDropdown
              value={plagiarismFilter}
              onChange={setPlagiarismFilter}
              options={[
                { value: "ALL", label: "Tất cả đạo văn" },
                { value: "CLEAN", label: "Bình thường" },
                { value: "PLAGIARIZED", label: "Trùng lặp cao" },
              ]}
            />
          </div>
        </div>

        {/* Results Counter */}
        <div className="text-xs font-semibold text-gray-navy dark:text-light-blue/70 text-left">
          {isFilterActive ? (
            <>
              Tìm thấy <span className="text-primary">{filteredSubmissions.length}</span> bài nộp phù hợp.
            </>
          ) : (
            <>
              Tìm thấy <span className="text-primary">{groupedSubmissions.length}</span> học viên phù hợp.
            </>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-250 dark:border-white/10 rounded-2xl bg-white/30 dark:bg-zinc-900/10">
          <Inbox className="size-12 text-gray-300 dark:text-gray-navy/60 mb-4" />
          <p className="font-bold text-dark-blue dark:text-white text-sm">Không tìm thấy bài nộp nào</p>
          <p className="text-xs text-gray-navy dark:text-light-blue/60 mt-1 max-w-xs">
            Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh các bộ lọc trạng thái bài làm.
          </p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-hidden border border-gray-150 dark:border-white/10 rounded-2xl bg-white dark:bg-navy-blue shadow-sm">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-150 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-900/20 text-gray-navy dark:text-light-blue/70 font-black uppercase tracking-wider">
                  <th className="p-4 pl-6">Học viên</th>
                  <th className="p-4">Lần nộp</th>
                  <th className="p-4">Thời gian nộp</th>
                  <th className="p-4">Trùng lặp</th>
                  <th className="p-4">Trạng thái</th>
                  <th className="p-4">Điểm số</th>
                  <th className="p-4 pr-6 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-150 dark:divide-white/10">
                {isFilterActive
                  ? filteredSubmissions.map((sub) => (
                      <DesktopSubmissionRow
                        key={sub.id}
                        homework={homework}
                        sub={sub}
                        onRetry={handleRetry}
                        retryingId={retryingId}
                      />
                    ))
                  : groupedSubmissions.map((group) => (
                      <DesktopSubmissionRow
                        key={group.userId}
                        homework={homework}
                        group={group}
                        onRetry={handleRetry}
                        retryingId={retryingId}
                      />
                    ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="lg:hidden space-y-4 text-left">
            {isFilterActive
              ? filteredSubmissions.map((sub) => (
                  <MobileSubmissionCard
                    key={sub.id}
                    homework={homework}
                    sub={sub}
                    onRetry={handleRetry}
                    retryingId={retryingId}
                  />
                ))
              : groupedSubmissions.map((group) => (
                  <MobileSubmissionCard
                    key={group.userId}
                    homework={homework}
                    group={group}
                    onRetry={handleRetry}
                    retryingId={retryingId}
                  />
                ))}
          </div>
        </>
      )}
    </div>
  );
}
