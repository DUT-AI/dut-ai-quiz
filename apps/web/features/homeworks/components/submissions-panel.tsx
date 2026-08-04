"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Search,
  Inbox,
  ArrowRight,
  ExternalLink,
  FileText,
  CheckCircle2,
  Clock3,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";

import { useExternalUsers } from "@/lib/queries";
import { useHomeworkSubmissions } from "../queries";
import { Homework } from "../types";
import { Button } from "@/components/ui/button";
import { formatDateTime, cn } from "@/lib/utils";

interface SubmissionsPanelProps {
  homework: Homework | null;
  onClose: () => void;
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

export function SubmissionsPanel({ homework, onClose }: SubmissionsPanelProps) {
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(homework?.id ?? null);
  const { data: usersData } = useExternalUsers();

  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedUsers, setExpandedUsers] = useState<Record<number, boolean>>({});

  const toggleExpand = (userId: number) => {
    setExpandedUsers((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const userById = useMemo(() => {
    return new Map((usersData?.data ?? []).map((user) => [user.id, user]));
  }, [usersData]);

  // Group submissions by user_id
  const groupedSubmissions = useMemo(() => {
    if (!submissionsData?.data) return [];

    // Map submissions to include owner_name
    const mapped = submissionsData.data.map((sub) => ({
      ...sub,
      owner_name: sub.owner_name || userById.get(sub.user_id)?.name || `Thành viên #${sub.user_id}`,
    }));

    // Filter by search query if any
    const filtered = searchQuery
      ? mapped.filter((sub) => sub.owner_name.toLowerCase().includes(searchQuery.toLowerCase()))
      : mapped;

    // Group by user_id
    const groups: { [key: number]: typeof mapped } = {};
    filtered.forEach((sub) => {
      if (!groups[sub.user_id]) {
        groups[sub.user_id] = [];
      }
      groups[sub.user_id].push(sub);
    });

    // Convert groups to array and sort by the latest submission time of each user
    return Object.entries(groups).map(([userId, subs]) => {
      const sortedSubs = [...subs].sort((a, b) => b.attempt_number - a.attempt_number);
      return {
        userId: Number(userId),
        owner_name: sortedSubs[0].owner_name,
        submissions: sortedSubs,
        latestSubmission: sortedSubs[0],
      };
    }).sort((a, b) => new Date(b.latestSubmission.submitted_at).getTime() - new Date(a.latestSubmission.submitted_at).getTime());
  }, [submissionsData, userById, searchQuery]);

  if (!homework || !mounted) return null;

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex justify-end">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />

        {/* Drawer content */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 25, stiffness: 220 }}
          className="relative z-10 h-full w-full max-w-md border-l border-gray-250 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-zinc-950 flex flex-col md:p-8 text-left"
        >
          {/* Header */}
          <div className="mb-6 flex items-start justify-between">
            <div className="space-y-1">
              <h2 className="text-xl font-black text-dark-blue dark:text-white flex items-center gap-2">
                <FileText className="size-5 text-primary" />
                Danh sách bài nộp
              </h2>
              <p className="text-xs text-gray-navy dark:text-light-blue/70 line-clamp-1">
                {homework.title}
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl p-2 text-gray-400 hover:bg-gray-150 hover:text-dark-blue dark:hover:bg-white/5 dark:hover:text-white transition-colors"
            >
              <X className="size-5" />
            </button>
          </div>

          {/* Search bar */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm học viên đã nộp..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-9 pr-4 rounded-xl border border-gray-250 bg-white text-xs outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/10 dark:bg-zinc-900/40 dark:text-white"
            />
          </div>

          {/* Submissions List Content - scrollable */}
          <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar space-y-3">
            {isLoadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <p className="mt-2 text-xs text-gray-navy dark:text-light-blue/70 animate-pulse">Đang tải...</p>
              </div>
            ) : groupedSubmissions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <Inbox className="size-10 text-gray-300 dark:text-gray-navy/60 mb-3" />
                <p className="font-bold text-dark-blue dark:text-white text-sm">Không có bài nộp nào</p>
                <p className="text-[11px] text-gray-navy dark:text-light-blue/60 mt-1">
                  {searchQuery ? "Không tìm thấy học viên tương ứng." : "Chưa có bài nộp nào cho bài tập này."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {groupedSubmissions.map((group) => {
                  const initials = getInitials(group.owner_name || "");
                  const latest = group.latestSubmission;

                  // Simple status design indicators
                  const statusColors = {
                    UPLOADED: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
                    GRADING: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 animate-pulse",
                    GRADED: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-100 dark:border-green-900/30",
                    FAILED: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-100 dark:border-red-900/30",
                  }[latest.status] || "bg-gray-150 text-gray-600";

                  const StatusIcon = {
                    UPLOADED: Clock3,
                    GRADING: Clock3,
                    GRADED: CheckCircle2,
                    FAILED: XCircle,
                  }[latest.status] || Clock3;

                  const isExpanded = !!expandedUsers[group.userId];
                  const cardBg = isExpanded
                    ? "bg-amber-50/40 border-amber-200/60 dark:bg-amber-950/10 dark:border-amber-900/30"
                    : "bg-white border-gray-150 dark:bg-zinc-900/20 dark:border-white/10";

                  return (
                    <div
                      key={group.userId}
                      className={cn(
                        "p-3.5 rounded-xl border transition-all duration-200",
                        cardBg
                      )}
                    >
                      {/* Top Row: Click to toggle expansion */}
                      <button
                        onClick={() => toggleExpand(group.userId)}
                        className="w-full flex items-center justify-between hover:opacity-90 transition-opacity outline-none text-left"
                      >
                        <div className="flex items-center gap-3">
                          {/* Circular Avatar Placeholder */}
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 border border-primary/20 dark:border-primary/30">
                            <span className="text-xs font-black text-primary dark:text-primary-foreground">
                              {initials}
                            </span>
                          </div>
                          {/* Student Name */}
                          <div className="space-y-0.5 text-left">
                            <p className="text-xs font-bold text-dark-blue dark:text-white">
                              {group.owner_name}
                            </p>
                            <span className="text-[10px] text-gray-navy dark:text-light-blue/50 block font-semibold">
                              Có {group.submissions.length} lần nộp
                            </span>
                          </div>
                        </div>

                        {/* Latest Attempt Status / Score / Chevron */}
                        <div className="flex items-center gap-3 shrink-0">
                          {latest.status === "GRADED" && latest.score !== undefined ? (
                            <div className="text-right">
                              <span className="text-sm font-black text-primary">
                                {latest.score}
                              </span>
                              <span className="text-[9px] text-gray-navy dark:text-light-blue/50 block -mt-1 font-bold">
                                Điểm mới nhất
                              </span>
                            </div>
                          ) : (
                            <div className={`p-1.5 rounded-lg border ${statusColors}`}>
                              <StatusIcon className="size-3.5" />
                            </div>
                          )}

                          {expandedUsers[group.userId] ? (
                            <ChevronUp className="size-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="size-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {/* Expandable Attempts List */}
                      <AnimatePresence initial={false}>
                        {expandedUsers[group.userId] && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden pt-3 mt-3 border-t border-t-amber-100 dark:border-t-amber-950/30 space-y-2.5 pl-4 border-l border-l-amber-200/60 dark:border-l-amber-900/30"
                          >
                            {group.submissions.map((sub) => {
                              const subStatusColors = {
                                UPLOADED: "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/30",
                                GRADING: "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/30 animate-pulse",
                                GRADED: "bg-green-500/10 text-green-600 dark:bg-green-500/20 dark:text-green-400 border-green-100 dark:border-green-900/30",
                                FAILED: "bg-red-500/10 text-red dark:bg-red-500/20 dark:text-red border-red-100 dark:border-red-900/30",
                              }[sub.status] || "bg-gray-150 text-gray-600";

                              const borderAccent = {
                                GRADED: "border-l-4 border-l-green-500",
                                GRADING: "border-l-4 border-l-amber-500 animate-pulse",
                                UPLOADED: "border-l-4 border-l-blue-500",
                                FAILED: "border-l-4 border-l-red-500",
                              }[sub.status] || "border-l-4 border-l-gray-300";

                              return (
                                <div
                                  key={sub.id}
                                  className={cn(
                                    "p-3 rounded-xl border border-amber-200/60 dark:border-amber-900/30 bg-amber-50/50 hover:bg-amber-50/80 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-xs space-y-1.5 transition-all duration-200 shadow-sm",
                                    borderAccent
                                  )}
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="space-y-0.5 text-left">
                                      <div className="flex items-center gap-1.5 font-bold text-dark-blue dark:text-white">
                                        <span>Lần nộp #{sub.attempt_number}</span>
                                        {sub.is_late && (
                                          <span className="text-[9px] px-1 bg-red/10 text-red dark:bg-red/20 rounded font-bold">Trễ</span>
                                        )}
                                        {sub.is_plagiarized && (
                                          <span className="text-[9px] px-1 bg-red/10 text-red dark:bg-red/20 rounded font-bold flex items-center gap-0.5 animate-pulse">
                                            <AlertTriangle className="size-2.5" /> Trùng lặp
                                          </span>
                                        )}
                                      </div>
                                      <div className="text-[10px] text-gray-navy/70 dark:text-light-blue/50 font-medium">
                                        {formatDateTime(sub.submitted_at)}
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {sub.status === "GRADED" && sub.score !== undefined ? (
                                        <span className="font-black text-primary text-sm">{sub.score} / 10</span>
                                      ) : (
                                        <span className={`text-[9px] px-1.5 py-0.5 rounded border font-bold ${subStatusColors}`}>
                                          {sub.status === "UPLOADED" ? "Đã nộp" : sub.status === "GRADING" ? "Đang chấm" : sub.status === "FAILED" ? "Lỗi" : sub.status}
                                        </span>
                                      )}
                                      <Link
                                        href={`/teacher/homeworks/${homework.id}/submissions/${sub.id}`}
                                        target="_blank"
                                        className="p-1.5 rounded-lg hover:bg-gray-150 dark:hover:bg-white/10 text-gray-navy hover:text-primary dark:text-light-blue dark:hover:text-white transition-colors"
                                      >
                                        <ExternalLink className="size-3.5" />
                                      </Link>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Sticky footer button */}
          <div className="mt-6 pt-4 border-t border-gray-150 dark:border-white/10 shrink-0">
            <Link href={`/teacher/homeworks/${homework.id}/submissions`} onClick={onClose}>
              <Button className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/95 hover:to-indigo-600/95 text-white rounded-xl h-11 flex items-center justify-center gap-2 font-bold shadow-md shadow-primary/10 transition-all duration-200">
                <FileText className="size-4" />
                <span>Quản lý tất cả bài nộp</span>
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
}
