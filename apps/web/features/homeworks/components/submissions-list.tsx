"use client";

import { useState, useMemo, Fragment } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Search,
  Download,
  Eye,
  Inbox,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { Homework, HomeworkSubmission } from "../types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";
import { openSubmissionFile } from "../queries";
import { FilterDropdown } from "@/components/ui/filter-dropdown";

interface SubmissionsListProps {
  homework: Homework;
  submissions: HomeworkSubmission[];
  isLoading: boolean;
}

const getInitials = (name: string) => {
  if (!name) return "?";
  return name
    .split(" ")
    .map((n) => n[0])
    .slice(-2)
    .join("")
    .toUpperCase();
};

export function SubmissionsList({ homework, submissions, isLoading }: SubmissionsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [plagiarismFilter, setPlagiarismFilter] = useState<string>("ALL");

  // Filters logic
  const filteredSubmissions = useMemo(() => {
    return submissions.filter((sub) => {
      const matchesSearch = sub.owner_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        `Thành viên #${sub.user_id}`.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus = statusFilter === "ALL" || sub.status === statusFilter;

      const matchesPlagiarized = plagiarismFilter === "ALL" ||
        (plagiarismFilter === "PLAGIARIZED" && sub.is_plagiarized) ||
        (plagiarismFilter === "CLEAN" && !sub.is_plagiarized);

      return matchesSearch && matchesStatus && matchesPlagiarized;
    });
  }, [submissions, searchQuery, statusFilter, plagiarismFilter]);

  const isFilterActive = useMemo(() => {
    return searchQuery !== "" || statusFilter !== "ALL" || plagiarismFilter !== "ALL";
  }, [searchQuery, statusFilter, plagiarismFilter]);

  const groupedSubmissions = useMemo(() => {
    if (isFilterActive) return [];

    // Group by user_id
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

    // Convert to array and sort each student's attempts
    return Object.entries(groups).map(([userId, subs]) => {
      const sortedSubs = [...subs].sort((a, b) => b.attempt_number - a.attempt_number);
      return {
        userId: Number(userId),
        owner_name: sortedSubs[0].owner_name,
        submissions: sortedSubs,
        latestSubmission: sortedSubs[0],
      };
    }).sort((a, b) => new Date(b.latestSubmission.submitted_at).getTime() - new Date(a.latestSubmission.submitted_at).getTime());
  }, [submissions, isFilterActive]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 border border-gray-150 rounded-2xl bg-white/50 dark:border-white/10 dark:bg-zinc-900/40">
        <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <p className="mt-2 text-xs text-gray-navy dark:text-light-blue/70 animate-pulse font-semibold">
          Đang tải danh sách bài nộp...
        </p>
      </div>
    );
  }

  const isEmpty = isFilterActive ? filteredSubmissions.length === 0 : groupedSubmissions.length === 0;

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
            {/* Status Filter */}
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

            {/* Plagiarism Filter */}
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
            <>Tìm thấy <span className="text-primary">{filteredSubmissions.length}</span> bài nộp phù hợp.</>
          ) : (
            <>Tìm thấy <span className="text-primary">{groupedSubmissions.length}</span> học viên phù hợp.</>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {isEmpty ? (
        <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-gray-250 dark:border-white/10 rounded-2xl bg-white/30 dark:bg-zinc-900/10">
          <Inbox className="size-12 text-gray-300 dark:text-gray-navy/60 mb-4" />
          <p className="font-bold text-dark-blue dark:text-white text-sm">Không tìm thấy bài nộp nào</p>
          <p className="text-xs text-gray-navy dark:text-light-blue/60 mt-1 max-w-xs">
            Thử thay đổi từ khóa tìm kiếm hoặc điều chỉnh các bộ lọc lọc trạng thái bài làm.
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
                      getInitials={getInitials}
                    />
                  ))
                  : groupedSubmissions.map((group) => (
                    <DesktopSubmissionRow
                      key={group.userId}
                      homework={homework}
                      group={group}
                      getInitials={getInitials}
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
                  getInitials={getInitials}
                />
              ))
              : groupedSubmissions.map((group) => (
                <MobileSubmissionCard
                  key={group.userId}
                  homework={homework}
                  group={group}
                  getInitials={getInitials}
                />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

// ==========================================
// SUB-COMPONENTS DEFINED LOCALLY IN ONE FILE
// ==========================================

interface DesktopSubmissionRowProps {
  homework: Homework;
  sub?: HomeworkSubmission;
  group?: {
    userId: number;
    owner_name?: string | null;
    submissions: HomeworkSubmission[];
    latestSubmission: HomeworkSubmission;
  };
  getInitials: (name: string) => string;
}

function DesktopSubmissionRow({ homework, sub, group, getInitials }: DesktopSubmissionRowProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Single Submission View (when filtered)
  if (sub) {
    const initials = getInitials(sub.owner_name || "");
    const statusConfig = {
      UPLOADED: { label: "Đã tải lên", icon: Clock3, className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30" },
      GRADING: { label: "Đang chấm", icon: Clock3, className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse" },
      GRADED: { label: "Đã chấm điểm", icon: CheckCircle2, className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30" },
      FAILED: { label: "Chấm lỗi", icon: XCircle, className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30" },
    }[sub.status] || { label: "Không rõ", icon: Clock3, className: "bg-gray-100 text-gray-500" };

    const StatusIcon = statusConfig.icon;

    return (
      <tr className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors">
        <td className="p-4 pl-6">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <span className="font-bold text-dark-blue dark:text-white block text-sm">
                {sub.owner_name}
              </span>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-medium">
                User ID: #{sub.user_id}
              </span>
            </div>
          </div>
        </td>
        <td className="p-4 font-semibold text-dark-blue dark:text-light-blue">
          Lần nộp #{sub.attempt_number}
        </td>
        <td className="p-4 text-gray-navy dark:text-light-blue/80">
          <span className="block font-medium">{formatDateTime(sub.submitted_at)}</span>
        </td>
        <td className="p-4">
          {sub.is_plagiarized ? (
            <span className="inline-flex items-center gap-1 text-red font-bold animate-pulse">
              <AlertTriangle className="size-3.5" /> Độ trùng cao
            </span>
          ) : (
            <span className="text-gray-navy/60 dark:text-light-blue/40 font-medium">An toàn</span>
          )}
        </td>
        <td className="p-4">
          <Badge variant="outline" className={`h-6 ${statusConfig.className} font-bold`}>
            <StatusIcon className="mr-1 size-3" /> {statusConfig.label}
          </Badge>
        </td>
        <td className="p-4">
          {sub.status === "GRADED" && sub.score !== undefined ? (
            <span className="text-sm font-black text-primary">{sub.score} / 10</span>
          ) : (
            <span className="text-gray-navy/40 dark:text-light-blue/30 font-bold">—</span>
          )}
        </td>
        <td className="p-4 pr-6 text-right">
          <div className="flex items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => openSubmissionFile(sub.id)}
              className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-xs"
            >
              <Download className="mr-1 size-3" /> Tải file (.zip)
            </Button>
            <Link href={`/teacher/homeworks/${homework.id}/submissions/${sub.id}`}>
              <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold gap-1 shadow-sm">
                <Eye className="size-3" /> Xem chi tiết
              </Button>
            </Link>
          </div>
        </td>
      </tr>
    );
  }

  // 2. Grouped Student Row (collapsible attempts list)
  if (group) {
    const initials = getInitials(group.owner_name || "");
    const latest = group.latestSubmission;

    const statusConfig = {
      UPLOADED: { label: "Đã tải lên", icon: Clock3, className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30" },
      GRADING: { label: "Đang chấm", icon: Clock3, className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse" },
      GRADED: { label: "Đã chấm điểm", icon: CheckCircle2, className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30" },
      FAILED: { label: "Chấm lỗi", icon: XCircle, className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30" },
    }[latest.status] || { label: "Không rõ", icon: Clock3, className: "bg-gray-100 text-gray-500" };

    const StatusIcon = statusConfig.icon;
    const hasPlagiarism = group.submissions.some((s) => s.is_plagiarized);

    return (
      <Fragment>
        <tr
          onClick={() => setIsExpanded(!isExpanded)}
          className="hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer select-none border-b border-gray-100 dark:border-white/5"
        >
          <td className="p-4 pl-6 text-left">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
                <span className="text-xs font-black text-primary dark:text-primary-foreground">
                  {initials}
                </span>
              </div>
              <div>
                <span className="font-bold text-dark-blue dark:text-white block text-sm">
                  {group.owner_name}
                </span>
                <span className="text-[10px] text-gray-navy dark:text-light-blue/50 font-medium block">
                  User ID: #{group.userId}
                </span>
              </div>
            </div>
          </td>
          <td className="p-4 font-semibold text-dark-blue dark:text-light-blue text-left">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-navy dark:text-light-blue/70">
              Lịch sử ({group.submissions.length})
              {isExpanded ? <ChevronUp className="size-4 text-primary" /> : <ChevronDown className="size-4" />}
            </span>
          </td>
          <td className="p-4 text-gray-navy dark:text-light-blue/80 text-left">
            <span className="block font-medium">{formatDateTime(latest.submitted_at)}</span>
          </td>
          <td className="p-4 text-left">
            {hasPlagiarism ? (
              <span className="inline-flex items-center gap-1 text-red font-bold animate-pulse">
                <AlertTriangle className="size-3.5" /> Độ trùng cao
              </span>
            ) : (
              <span className="text-gray-navy/60 dark:text-light-blue/40 font-medium">An toàn</span>
            )}
          </td>
          <td className="p-4 text-left">
            <Badge variant="outline" className={`h-6 ${statusConfig.className} font-bold`}>
              <StatusIcon className="mr-1 size-3" /> {statusConfig.label}
            </Badge>
          </td>
          <td className="p-4 text-left">
            {latest.status === "GRADED" && latest.score !== undefined ? (
              <span className="text-sm font-black text-primary">{latest.score} / 10</span>
            ) : (
              <span className="text-gray-navy/40 dark:text-light-blue/30 font-bold">—</span>
            )}
          </td>
          <td className="p-4 pr-6 text-right">
            <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openSubmissionFile(latest.id)}
                className="h-8 border-gray-200 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-xs"
              >
                <Download className="mr-1 size-3" /> Tải file
              </Button>
              <Link href={`/teacher/homeworks/${homework.id}/submissions/${latest.id}`}>
                <Button size="sm" className="h-8 bg-primary hover:bg-primary/90 text-white rounded-lg text-xs font-bold gap-1 shadow-sm">
                  <Eye className="size-3" /> Xem chi tiết
                </Button>
              </Link>
            </div>
          </td>
        </tr>

        {isExpanded && (
          <tr className="bg-amber-50/35 dark:bg-amber-950/10 transition-colors">
            <td colSpan={7} className="p-4 pl-12">
              <div className="space-y-3 border-l-2 border-amber-400 pl-6 py-2">
                <h5 className="font-bold text-xs text-dark-blue dark:text-white uppercase tracking-wider mb-2 text-left">
                  Lịch sử bài nộp của {group.owner_name}
                </h5>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {group.submissions.map((item) => {
                    const subStatusConfig = {
                      UPLOADED: { label: "Đã tải lên", className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30" },
                      GRADING: { label: "Đang chấm", className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse" },
                      GRADED: { label: "Đã chấm điểm", className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30" },
                      FAILED: { label: "Chấm lỗi", className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30" },
                    }[item.status] || { label: "Không rõ", className: "bg-gray-100 text-gray-500" };

                    const borderAccent = {
                      GRADED: "border-l-4 border-l-green-500",
                      GRADING: "border-l-4 border-l-amber-500 animate-pulse",
                      UPLOADED: "border-l-4 border-l-blue-500",
                      FAILED: "border-l-4 border-l-red-500",
                    }[item.status] || "border-l-4 border-l-gray-300";

                    return (
                      <div
                        key={item.id}
                        className={cn(
                          "p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 flex flex-col gap-2 transition-all duration-200 shadow-sm",
                          borderAccent
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="text-left">
                            <div className="flex items-center gap-1.5 font-bold text-dark-blue dark:text-white text-xs">
                              <span>Lần nộp #{item.attempt_number}</span>
                              {item.is_plagiarized && (
                                <span className="text-[9px] px-1 bg-red/10 text-red dark:bg-red/20 rounded font-bold flex items-center gap-0.5 animate-pulse">
                                  <AlertTriangle className="size-2.5 text-red shrink-0 ml-0.5" /> Trùng lặp
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] text-gray-navy/70 dark:text-light-blue/50 font-medium">
                              {formatDateTime(item.submitted_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                            <Badge variant="outline" className={`h-5 text-[10px] font-bold ${subStatusConfig.className}`}>
                              {subStatusConfig.label}
                            </Badge>
                            {item.status === "GRADED" && item.score !== undefined && (
                              <span className="font-black text-primary text-xs">{item.score} / 10</span>
                            )}
                            <Link href={`/teacher/homeworks/${homework.id}/submissions/${item.id}`}>
                              <Button size="sm" className="h-6 text-[10px] px-2 py-0.5 bg-primary hover:bg-primary/95 text-white rounded font-bold flex items-center gap-0.5 shadow-sm">
                                Chi tiết <ChevronRight className="size-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </td>
          </tr>
        )}
      </Fragment>
    );
  }

  return null;
}

interface MobileSubmissionCardProps {
  homework: Homework;
  sub?: HomeworkSubmission;
  group?: {
    userId: number;
    owner_name?: string | null;
    submissions: HomeworkSubmission[];
    latestSubmission: HomeworkSubmission;
  };
  getInitials: (name: string) => string;
}

function MobileSubmissionCard({ homework, sub, group, getInitials }: MobileSubmissionCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // 1. Single Submission View (when filtered)
  if (sub) {
    const initials = getInitials(sub.owner_name || "");
    const statusConfig = {
      UPLOADED: { label: "Đã tải lên", className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400" },
      GRADING: { label: "Đang chấm", className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 animate-pulse" },
      GRADED: { label: "Đã chấm điểm", className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400" },
      FAILED: { label: "Chấm lỗi", className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red" },
    }[sub.status] || { label: "Không rõ", className: "bg-gray-100 text-gray-500" };

    return (
      <div className="p-5 rounded-2xl border border-gray-150 bg-white dark:border-white/10 dark:bg-navy-blue/60 backdrop-blur-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-dark-blue dark:text-white text-sm">{sub.owner_name}</h4>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/60 font-medium">
                User ID: #{sub.user_id}
              </span>
            </div>
          </div>

          {sub.status === "GRADED" && sub.score !== undefined ? (
            <div className="text-right">
              <span className="text-base font-black text-primary block">{sub.score}</span>
              <span className="text-[8px] text-gray-navy dark:text-light-blue/45 font-bold uppercase tracking-wide block -mt-1">
                Điểm số
              </span>
            </div>
          ) : (
            <Badge variant="outline" className={`h-5 ${statusConfig.className} font-bold text-[9px]`}>
              {statusConfig.label}
            </Badge>
          )}
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-semibold">
          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Lần nộp
            </span>
            <span className="text-dark-blue dark:text-white font-bold block text-left">
              Lần nộp #{sub.attempt_number}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Thời gian
            </span>
            <span className="text-dark-blue dark:text-white font-bold block truncate text-left">
              {formatDateTime(sub.submitted_at)}
            </span>
          </div>

          <div>
            <span className="text-[10px] text-gray-navy/60 dark:text-light-blue/40 block uppercase tracking-wider text-left">
              Trùng lặp
            </span>
            {sub.is_plagiarized ? (
              <span className="text-red font-bold flex items-center gap-0.5 animate-pulse text-left">
                <AlertTriangle className="size-3 shrink-0" /> Trùng lặp cao
              </span>
            ) : (
              <span className="text-gray-navy/50 dark:text-light-blue/30 text-left block">An toàn</span>
            )}
          </div>
        </div>

        <hr className="border-gray-100 dark:border-white/5" />

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => openSubmissionFile(sub.id)}
            className="flex-1 h-9 border-gray-250 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-xl text-xs font-bold gap-1.5"
          >
            <Download className="size-3.5" /> Tải file
          </Button>
          <Link href={`/teacher/homeworks/${homework.id}/submissions/${sub.id}`} className="flex-1">
            <Button
              size="sm"
              className="w-full h-9 bg-primary hover:bg-primary/90 text-white rounded-xl text-xs font-bold gap-1.5 shadow-sm"
            >
              <Eye className="size-3.5" /> Chi tiết <ChevronRight className="size-3.5 ml-auto" />
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // 2. Grouped Student View (collapsible attempts list)
  if (group) {
    const initials = getInitials(group.owner_name || "");
    const latest = group.latestSubmission;

    const statusConfig = {
      UPLOADED: { label: "Đã nộp", className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30" },
      GRADING: { label: "Đang chấm", className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse" },
      GRADED: { label: "Đã chấm điểm", className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30" },
      FAILED: { label: "Chấm lỗi", className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30" },
    }[latest.status] || { label: "Không rõ", className: "bg-gray-100 text-gray-500" };

    const cardBg = isExpanded
      ? "bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30"
      : "bg-white border-gray-150 dark:bg-navy-blue/60 dark:border-white/10";

    return (
      <div className={cn("p-4 rounded-2xl border backdrop-blur-sm space-y-3 transition-all duration-200", cardBg)}>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center justify-between hover:opacity-90 transition-opacity outline-none text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
              <span className="text-xs font-black text-primary dark:text-primary-foreground">
                {initials}
              </span>
            </div>
            <div>
              <h4 className="font-bold text-dark-blue dark:text-white text-sm text-left">{group.owner_name}</h4>
              <span className="text-[10px] text-gray-navy dark:text-light-blue/60 font-medium block text-left">
                User ID: #{group.userId} • {group.submissions.length} lần nộp
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {latest.status === "GRADED" && latest.score !== undefined ? (
              <div className="text-right">
                <span className="text-sm font-black text-primary block leading-none">{latest.score}đ</span>
                <span className="text-[8px] text-gray-navy dark:text-light-blue/45 font-bold uppercase tracking-wide block mt-0.5">
                  Mới nhất
                </span>
              </div>
            ) : (
              <Badge variant="outline" className={`h-5 ${statusConfig.className} font-bold text-[9px] px-1.5`}>
                {statusConfig.label}
              </Badge>
            )}
            {isExpanded ? <ChevronUp className="size-4 text-gray-400" /> : <ChevronDown className="size-4" />}
          </div>
        </button>

        <AnimatePresence initial={false}>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden space-y-3 pt-3 border-t border-t-amber-100 dark:border-t-amber-950/30 pl-4 border-l border-l-amber-200/60 dark:border-l-amber-900/30"
            >
              <h5 className="font-bold text-[10px] text-gray-navy/60 dark:text-light-blue/40 uppercase tracking-wider text-left">
                Lịch sử nộp bài
              </h5>
              <div className="space-y-2">
                {group.submissions.map((item) => {
                  const subStatusConfig = {
                    UPLOADED: { label: "Đã nộp", className: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-200 dark:border-blue-800/30" },
                    GRADING: { label: "Đang chấm", className: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-200 dark:border-amber-800/30 animate-pulse" },
                    GRADED: { label: "Đã chấm điểm", className: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-200 dark:border-green-800/30" },
                    FAILED: { label: "Chấm lỗi", className: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-200 dark:border-red-800/30" },
                  }[item.status] || { label: "Không rõ", className: "bg-gray-100 text-gray-500" };

                  const borderAccent = {
                    GRADED: "border-l-4 border-l-green-500",
                    GRADING: "border-l-4 border-l-amber-500 animate-pulse",
                    UPLOADED: "border-l-4 border-l-blue-500",
                    FAILED: "border-l-4 border-l-red-500",
                  }[item.status] || "border-l-4 border-l-gray-300";

                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 space-y-2 transition-all duration-200 shadow-sm",
                        borderAccent
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="flex items-center gap-1.5 font-bold text-dark-blue dark:text-white text-xs">
                            <span>Lần nộp #{item.attempt_number}</span>
                            {item.is_plagiarized && (
                              <span className="text-[9px] px-1 bg-red/10 text-red dark:bg-red/20 rounded font-bold flex items-center gap-0.5 animate-pulse">
                                <AlertTriangle className="size-2.5 text-red shrink-0" /> Trùng lặp
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-gray-navy/70 dark:text-light-blue/50 font-medium block font-sans">
                            {formatDateTime(item.submitted_at)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className={`h-5 text-[9px] font-bold ${subStatusConfig.className} px-1.5`}>
                            {subStatusConfig.label}
                          </Badge>
                          {item.status === "GRADED" && item.score !== undefined && (
                            <span className="font-black text-primary text-xs shrink-0">{item.score} / 10</span>
                          )}
                        </div>
                      </div>



                      <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openSubmissionFile(item.id)}
                          className="flex-1 h-7 border-gray-250 text-gray-700 hover:bg-gray-50 dark:border-white/10 dark:text-light-blue dark:hover:bg-white/5 rounded-lg text-[10px] font-bold gap-1"
                        >
                          <Download className="size-3" /> Tải file
                        </Button>
                        <Link href={`/teacher/homeworks/${homework.id}/submissions/${item.id}`} className="flex-1">
                          <Button
                            size="sm"
                            className="w-full h-7 bg-primary hover:bg-primary/95 text-white rounded-lg text-[10px] font-bold gap-1 shadow-sm"
                          >
                            <Eye className="size-3" /> Chi tiết
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return null;
}
