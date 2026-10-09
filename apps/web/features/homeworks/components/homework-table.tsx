"use client";

import React, { useState, useMemo } from "react";
import { createPortal } from "react-dom";
import {
  Eye,
  Edit3,
  Archive,
  GraduationCap,
  Users,
  Calendar,
  FileCode,
  FileText,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Paperclip,
  CheckCircle2,
  Loader2,
  Clock,
  AlertTriangle,
  X,
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { Homework } from "../types";

function GradingStatusBadge({
  status,
  error,
}: {
  status?: string;
  error?: string | null;
}) {
  const [showErrorModal, setShowErrorModal] = useState(false);
  const normalized = (status || "PENDING").toUpperCase();

  let badgeContent: React.ReactNode;

  switch (normalized) {
    case "READY":
      badgeContent = (
        <span
          title="Rubric và cấu hình chấm tự động đã sẵn sàng"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap"
        >
          <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span>READY</span>
        </span>
      );
      break;

    case "PROCESSING":
      badgeContent = (
        <span
          title="Hệ thống AI đang phân tích đề bài và tạo rubric chấm..."
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/10 text-sky-700 dark:text-sky-400 border border-sky-500/20 whitespace-nowrap"
        >
          <Loader2 className="size-3.5 text-sky-500 animate-spin shrink-0" />
          <span>PROCESSING</span>
        </span>
      );
      break;

    case "FAILED":
      badgeContent = (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowErrorModal(true);
          }}
          title={error ? `Lỗi: ${error}\n(Bấm để xem chi tiết)` : "Lỗi phân tích rubric - Bấm để xem chi tiết"}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20 hover:bg-rose-500/20 transition-colors cursor-pointer group whitespace-nowrap"
        >
          <AlertTriangle className="size-3.5 text-rose-600 dark:text-rose-400 shrink-0" />
          <span>FAILED</span>
          {error && (
            <span className="size-1.5 rounded-full bg-rose-500 animate-pulse" />
          )}
        </button>
      );
      break;

    case "PENDING":
    default:
      badgeContent = (
        <span
          title="Đang chờ hàng đợi phân tích đề bài"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap"
        >
          <Clock className="size-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
          <span>PENDING</span>
        </span>
      );
      break;
  }

  return (
    <>
      {badgeContent}
      {showErrorModal &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              e.stopPropagation();
              setShowErrorModal(false);
            }}
          >
            <div
              className="relative max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-rose-200 dark:border-rose-900/40 bg-white dark:bg-navy-blue p-6 shadow-2xl text-left"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
                  <div className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/20">
                    <AlertTriangle className="size-5" />
                  </div>
                  <div>
                    <h4 className="text-base font-black text-dark-blue dark:text-white">
                      Lỗi khởi tạo Rubric chấm
                    </h4>
                    <p className="text-xs text-gray-navy dark:text-light-blue/70">
                      Hệ thống AI gặp lỗi khi phân tích đề bài bài tập này
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowErrorModal(false)}
                  className="rounded-lg p-1 text-gray-400 hover:text-gray-600 dark:hover:text-white"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="rounded-xl bg-gray-50 dark:bg-zinc-950/40 p-4 border border-gray-200 dark:border-white/10 text-xs text-rose-700 dark:text-rose-300 font-mono whitespace-pre-wrap break-words max-h-60 overflow-y-auto custom-scrollbar">
                {error || "Không có chi tiết lỗi nào được ghi lại."}
              </div>

              <p className="mt-3 text-xs text-gray-navy/80 dark:text-light-blue/70 leading-relaxed">
                💡 <strong>Gợi ý:</strong> Bạn có thể bấm nút <strong>Sửa</strong> bài tập để cập nhật lại mô tả hoặc thay đổi file đính kèm, hệ thống sẽ tự động gửi yêu cầu phân tích lại rubric.
              </p>

              <div className="mt-5 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowErrorModal(false)}
                  className="rounded-xl px-4"
                >
                  Đóng
                </Button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}

interface HomeworkTableProps {
  homeworks: Homework[];
  lessons?: { id: string; name: string }[];
  onViewSubmissions?: (homework: Homework) => void;
  onEdit: (homework: Homework) => void;
  onArchive: (homework: Homework) => void;
  showLessonColumn?: boolean;
  pageSize?: number;
}

export function HomeworkTable({
  homeworks,
  lessons = [],
  onViewSubmissions,
  onEdit,
  onArchive,
  showLessonColumn = true,
  pageSize = 10,
}: HomeworkTableProps) {
  const [currentPage, setCurrentPage] = useState(1);

  // Reset page when dataset length changes dramatically
  React.useEffect(() => {
    setCurrentPage(1);
  }, [homeworks.length]);

  const totalPages = Math.max(1, Math.ceil(homeworks.length / pageSize));
  const paginatedHomeworks = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return homeworks.slice(startIndex, startIndex + pageSize);
  }, [homeworks, currentPage, pageSize]);

  const formatDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (homeworks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-gray-200 dark:border-white/10 p-12 text-center bg-white/50 dark:bg-navy-blue/30">
        <AlertCircle className="mx-auto size-10 text-gray-300 dark:text-gray-navy mb-3" />
        <p className="font-bold text-dark-blue dark:text-white text-base">Không có bài tập nào</p>
        <p className="mt-1 text-xs text-gray-navy dark:text-light-blue/70">
          Chưa có bài tập nào trong danh sách hoặc không khớp với tiêu chí tìm kiếm.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-4">
      {/* Table Container */}
      <div className="w-full overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-blue shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/75 dark:bg-white/[0.03] text-xs font-black uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
                <th className="py-3.5 px-4 md:px-5">Bài tập</th>
                {showLessonColumn && <th className="py-3.5 px-4 hidden md:table-cell">Bài học liên kết</th>}
                <th className="py-3.5 px-4 text-center">Grading status</th>
                <th className="py-3.5 px-4 text-center">Đã nộp</th>
                <th className="py-3.5 px-4 hidden sm:table-cell">Ngày tạo</th>
                <th className="py-3.5 px-4 md:px-5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 dark:divide-white/5 font-medium">
              {paginatedHomeworks.map((hw) => {
                const lessonName =
                  lessons.find((l) => l.id === hw.lesson_id)?.name || "Chưa phân loại";

                return (
                  <tr
                    key={hw.id}
                    className="hover:bg-indigo-50/20 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    {/* Homework Title & Details */}
                    <td className="py-3.5 px-4 md:px-5">
                      <div className="flex items-start gap-3 min-w-[220px]">
                        <div className="size-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 mt-0.5">
                          <FileCode className="size-4.5" />
                        </div>
                        <div className="space-y-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/teacher/homeworks/${hw.id}`}
                              className="font-extrabold text-dark-blue dark:text-white line-clamp-1 hover:text-primary transition-colors text-sm"
                            >
                              {hw.title}
                            </Link>
                            {hw.has_attachment && (
                              <span
                                title="Có tài liệu đính kèm"
                                className="inline-flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0"
                              >
                                <Paperclip className="size-2.5" />
                                File
                              </span>
                            )}
                          </div>
                          {hw.description ? (
                            <p className="text-xs text-gray-navy/80 dark:text-light-blue/70 line-clamp-1 max-w-md">
                              {hw.description.replace(/[#*`_]/g, "")}
                            </p>
                          ) : (
                            <p className="text-[11px] text-gray-navy/50 dark:text-light-blue/40 italic">
                              Chưa có mô tả
                            </p>
                          )}
                          {/* Mobile Lesson Name */}
                          {showLessonColumn && (
                            <div className="md:hidden flex items-center gap-1 text-[11px] font-semibold text-primary pt-0.5">
                              <GraduationCap className="size-3" />
                              <span className="truncate max-w-[180px]">{lessonName}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Lesson Column */}
                    {showLessonColumn && (
                      <td className="py-3.5 px-4 hidden md:table-cell max-w-[200px]">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-navy dark:text-light-blue text-xs font-semibold max-w-full truncate border border-gray-200/60 dark:border-white/5">
                          <GraduationCap className="size-3 text-primary shrink-0" />
                          <span className="truncate">{lessonName}</span>
                        </span>
                      </td>
                    )}

                    {/* Grading Status Column */}
                    <td className="py-3.5 px-4 text-center">
                      <GradingStatusBadge
                        status={hw.grading_status}
                        error={hw.grading_error}
                      />
                    </td>

                    {/* Submissions Count */}
                    <td className="py-3.5 px-4 text-center">
                      <Link
                        href={`/teacher/homeworks/${hw.id}?tab=submissions`}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 dark:bg-indigo-400/10 text-indigo-650 dark:text-indigo-400 font-extrabold text-xs hover:bg-indigo-500/20 transition-colors cursor-pointer border border-indigo-500/20"
                        title="Xem danh sách bài nộp"
                      >
                        <Users className="size-3.5" />
                        <span>{hw.submitted_count} bài</span>
                      </Link>
                    </td>

                    {/* Created Date */}
                    <td className="py-3.5 px-4 hidden sm:table-cell text-xs text-gray-navy/80 dark:text-light-blue/60 font-semibold">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="size-3 text-gray-400" />
                        <span>{formatDate(hw.created_at)}</span>
                      </div>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-3.5 px-4 md:px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/teacher/homeworks/${hw.id}`}
                          className="inline-flex items-center h-8 px-2.5 rounded-lg border border-indigo-200 dark:border-indigo-900/40 bg-indigo-50/40 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white dark:hover:bg-indigo-500 dark:hover:text-white text-xs font-bold transition-all shadow-none"
                          title="Xem chi tiết bài tập & danh sách bài nộp"
                        >
                          <Eye className="size-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Chi tiết</span>
                        </Link>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEdit(hw)}
                          className="h-8 px-2.5 rounded-lg border-amber-200 dark:border-amber-900/40 bg-amber-50/40 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500 hover:text-white dark:hover:bg-amber-500 dark:hover:text-white text-xs font-bold transition-all shadow-none"
                          title="Chỉnh sửa bài tập"
                        >
                          <Edit3 className="size-3.5 sm:mr-1" />
                          <span className="hidden sm:inline">Sửa</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onArchive(hw)}
                          className="h-8 px-2.5 rounded-lg border-rose-200 dark:border-rose-900/40 bg-rose-50/40 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 hover:bg-rose-500 hover:text-white dark:hover:bg-rose-500 dark:hover:text-white text-xs font-bold transition-all shadow-none"
                          title="Lưu trữ bài tập"
                        >
                          <Archive className="size-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 md:px-5 py-3 border-t border-gray-200 dark:border-white/10 bg-gray-50/40 dark:bg-white/[0.01] text-xs text-gray-navy dark:text-light-blue/70">
            <div>
              Hiển thị{" "}
              <strong className="text-dark-blue dark:text-white">
                {(currentPage - 1) * pageSize + 1}
              </strong>{" "}
              -{" "}
              <strong className="text-dark-blue dark:text-white">
                {Math.min(currentPage * pageSize, homeworks.length)}
              </strong>{" "}
              trên tổng số <strong className="text-primary">{homeworks.length}</strong> bài tập
            </div>

            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <span className="px-2 font-bold text-dark-blue dark:text-white">
                {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="h-8 w-8 p-0 rounded-lg"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
