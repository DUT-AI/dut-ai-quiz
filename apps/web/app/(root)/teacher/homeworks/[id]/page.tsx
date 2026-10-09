"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  BookOpenCheck,
  GraduationCap,
  Users,
  Edit3,
  Archive,
  Calendar,
  Clock,
  Paperclip,
  CheckCircle2,
  Loader2,
  AlertTriangle,
  FileArchive,
  Download,
  Copy,
  Check,
  Sparkles,
  ExternalLink,
  FileCode,
  Layers,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Markdown } from "@/components/markdown";
import { useLessons } from "@/lib/queries";
import {
  useHomework,
  useHomeworkSubmissions,
  useArchiveHomework,
  openHomeworkAttachment,
} from "@/features/homeworks/queries";
import { SubmissionsStats } from "@/features/homeworks/components/submissions-stats";
import { SubmissionsList } from "@/features/homeworks/components/submissions-list";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";
import { Homework } from "@/features/homeworks/types";
import { cn } from "@/lib/utils";

export default function TeacherHomeworkDetailPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const homeworkId = params?.id as string;

  // Active tab: 'overview' | 'submissions'
  const initialTab = searchParams.get("tab") === "submissions" ? "submissions" : "overview";
  const [activeTab, setActiveTab] = useState<"overview" | "submissions">(initialTab);

  // Modals state
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isArchiveConfirmOpen, setIsArchiveConfirmOpen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [copiedId, setCopiedId] = useState(false);

  // Queries
  const { data: homework, isLoading: isLoadingHomework } = useHomework(homeworkId);
  const { data: submissionsData, isLoading: isLoadingSubmissions } = useHomeworkSubmissions(homeworkId);
  const { data: lessons = [] } = useLessons();
  const archive = useArchiveHomework();

  const submissions = useMemo(() => {
    return submissionsData?.data || [];
  }, [submissionsData]);

  const lesson = useMemo(() => {
    if (!homework?.lesson_id) return null;
    return lessons.find((l) => l.id === homework.lesson_id) || null;
  }, [homework, lessons]);

  // Tab switch handler with URL update (without full page reload)
  const handleTabChange = (tab: "overview" | "submissions") => {
    setActiveTab(tab);
    const url = new URL(window.location.href);
    if (tab === "submissions") {
      url.searchParams.set("tab", "submissions");
    } else {
      url.searchParams.delete("tab");
    }
    window.history.replaceState({}, "", url.toString());
  };

  const handleDownloadAttachment = async () => {
    if (!homework?.id) return;
    try {
      setIsDownloading(true);
      await openHomeworkAttachment(homework.id);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Không thể tải tệp đính kèm");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleCopyId = () => {
    if (!homework?.id) return;
    navigator.clipboard.writeText(homework.id);
    setCopiedId(true);
    toast.success("Đã copy mã bài tập vào clipboard");
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleConfirmArchive = async () => {
    if (!homework?.id) return;
    try {
      await archive.mutateAsync(homework.id);
      toast.success("Đã lưu trữ bài tập thành công");
      router.push("/teacher/homeworks");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Thao tác thất bại");
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      return new Date(dateStr).toLocaleString("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  if (isLoadingHomework) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-sm text-gray-navy/70 space-y-3">
        <div className="size-8 border-4 border-primary border-t-transparent animate-spin rounded-full" />
        <span className="font-bold dark:text-light-blue">Đang tải dữ liệu bài tập...</span>
      </div>
    );
  }

  if (!homework) {
    return (
      <div className="text-left py-10 space-y-4 max-w-xl">
        <div className="p-5 rounded-3xl bg-red-500/10 border border-red-200 text-red font-bold text-sm dark:bg-red-500/20 dark:border-red-900/30">
          Không tìm thấy bài tập được yêu cầu hoặc bài tập đã bị xóa / lưu trữ.
        </div>
        <Button
          onClick={() => router.push("/teacher/homeworks")}
          className="rounded-2xl flex items-center gap-2"
        >
          <ArrowLeft className="size-4" />
          Quay lại quản lý bài tập
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-16 text-left">
      {/* Navigation Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          onClick={() => {
            if (typeof window !== "undefined" && window.history.length > 1) {
              router.back();
            } else {
              router.push("/teacher/homeworks");
            }
          }}
          className="group inline-flex items-center gap-2 text-xs font-black text-gray-navy hover:text-navy-blue dark:text-light-blue/70 dark:hover:text-white transition-colors cursor-pointer w-fit"
        >
          <ArrowLeft className="size-4 group-hover:-translate-x-0.5 transition-transform" />
          <span>Quay lại danh sách bài tập</span>
        </button>

        {/* Quick Link to Lesson */}
        {lesson && (
          <Link
            href={`/teacher/lessons/${lesson.id}/homeworks`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
          >
            <GraduationCap className="size-3.5" />
            <span>Bài học: {lesson.name}</span>
            <ExternalLink className="size-3" />
          </Link>
        )}
      </div>

      {/* Main Header Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-6"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-2 flex-1 min-w-0">
            {/* Meta Tags */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-black uppercase tracking-wider">
                <FileCode className="size-3" />
                Coding Assignment
              </span>

              {/* Grading Status Badge */}
              {homework.grading_status === "READY" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold border border-emerald-500/20">
                  <CheckCircle2 className="size-3 text-emerald-600 dark:text-emerald-400" />
                  AI Sẵn sàng chấm (READY)
                </span>
              )}
              {homework.grading_status === "PROCESSING" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[11px] font-bold border border-sky-500/20">
                  <Loader2 className="size-3 text-sky-500 animate-spin" />
                  Đang phân tích rubric (PROCESSING)
                </span>
              )}
              {homework.grading_status === "FAILED" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/10 text-rose-700 dark:text-rose-400 text-[11px] font-bold border border-rose-500/20">
                  <AlertTriangle className="size-3 text-rose-600 dark:text-rose-400" />
                  Lỗi khởi tạo rubric (FAILED)
                </span>
              )}
              {(!homework.grading_status || homework.grading_status === "PENDING") && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[11px] font-bold border border-amber-500/20">
                  <Clock className="size-3 text-amber-600 dark:text-amber-400" />
                  Chờ phân tích (PENDING)
                </span>
              )}

              {/* Attachment Tag */}
              {homework.has_attachment && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[11px] font-bold border border-indigo-500/20">
                  <Paperclip className="size-3" />
                  Có file đính kèm (.zip)
                </span>
              )}
            </div>

            {/* Assignment Title */}
            <h1 className="text-2xl sm:text-3xl font-black text-dark-blue dark:text-white tracking-tight">
              {homework.title}
            </h1>

            {/* Dates & ID meta */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-navy/80 dark:text-light-blue/70 font-semibold pt-1">
              <span className="inline-flex items-center gap-1.5">
                <Calendar className="size-3.5 text-gray-400" />
                Ngày tạo: {formatDate(homework.created_at)}
              </span>
              <span>•</span>
              <span className="inline-flex items-center gap-1.5">
                <Clock className="size-3.5 text-gray-400" />
                Cập nhật: {formatDate(homework.updated_at)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              onClick={() => setIsEditOpen(true)}
              className="h-10 rounded-xl px-4 flex items-center gap-2 font-bold shadow-sm"
            >
              <Edit3 className="size-4" />
              <span>Chỉnh sửa bài tập</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => setIsArchiveConfirmOpen(true)}
              className="h-10 rounded-xl px-3.5 border-rose-200 dark:border-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/20"
              title="Lưu trữ bài tập này"
            >
              <Archive className="size-4" />
            </Button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="border-t border-gray-150 dark:border-white/10 pt-4 flex items-center gap-2">
          <button
            onClick={() => handleTabChange("overview")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === "overview"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-gray-navy/80 dark:text-light-blue/70 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <BookOpenCheck className="size-4" />
            <span>Tổng quan & Đề bài</span>
          </button>

          <button
            onClick={() => handleTabChange("submissions")}
            className={cn(
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer",
              activeTab === "submissions"
                ? "bg-primary text-white shadow-md shadow-primary/25"
                : "text-gray-navy/80 dark:text-light-blue/70 hover:bg-gray-100 dark:hover:bg-white/5"
            )}
          >
            <Users className="size-4" />
            <span>Danh sách bài nộp</span>
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-xs font-black",
                activeTab === "submissions"
                  ? "bg-white/20 text-white"
                  : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400"
              )}
            >
              {submissions.length}
            </span>
          </button>
        </div>
      </motion.div>

      {/* TAB 1: OVERVIEW & HOMEWORK DETAILS */}
      {activeTab === "overview" && (
        <motion.div
          key="tab-overview"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
                Tổng lượt nộp
              </p>
              <p className="text-2xl font-black text-dark-blue dark:text-white">
                {submissions.length} <span className="text-xs font-semibold text-gray-navy/70">lượt</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
                Học viên tham gia
              </p>
              <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                {new Set(submissions.map((s) => s.user_id)).size}{" "}
                <span className="text-xs font-semibold text-gray-navy/70">học viên</span>
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
                Tỷ lệ đạt (Pass)
              </p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                {(() => {
                  const graded = submissions.filter((s) => s.status === "GRADED");
                  if (graded.length === 0) return "—";
                  const pass = graded.filter((s) => s.is_pass).length;
                  return `${Math.round((pass / graded.length) * 100)}%`;
                })()}
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 shadow-sm space-y-1">
              <p className="text-[11px] font-bold uppercase tracking-wider text-gray-navy/70 dark:text-light-blue/60">
                Điểm trung bình
              </p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400">
                {(() => {
                  const graded = submissions.filter((s) => s.status === "GRADED");
                  if (graded.length === 0) return "—";
                  const avg = graded.reduce((sum, s) => sum + (s.score || 0), 0) / graded.length;
                  return `${avg.toFixed(1)}/10`;
                })()}
              </p>
            </div>
          </div>

          {/* Detailed Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left 2 Columns: Description & Attachment */}
            <div className="lg:col-span-2 space-y-6">
              {/* Assignment Description Card */}
              <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-white/5">
                  <h3 className="text-lg font-black text-dark-blue dark:text-white flex items-center gap-2">
                    <BookOpenCheck className="size-5 text-primary" />
                    Mô tả / Đề bài chi tiết
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsEditOpen(true)}
                    className="text-xs font-bold text-primary hover:bg-primary/10 rounded-xl"
                  >
                    <Edit3 className="size-3.5 mr-1" />
                    Chỉnh sửa đề bài
                  </Button>
                </div>

                {homework.description ? (
                  <div className="prose dark:prose-invert max-w-none text-sm md:text-base leading-relaxed break-words">
                    <Markdown content={homework.description} />
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-navy/60 dark:text-light-blue/50 italic text-sm">
                    Chưa có nội dung mô tả chi tiết cho bài tập này.
                  </div>
                )}
              </div>

              {/* Attachment File Card */}
              <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 md:p-8 shadow-sm space-y-4">
                <h3 className="text-lg font-black text-dark-blue dark:text-white flex items-center gap-2 pb-3 border-b border-gray-100 dark:border-white/5">
                  <Paperclip className="size-5 text-primary" />
                  Tệp đề bài đính kèm
                </h3>

                {homework.has_attachment ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl border border-emerald-500/30 bg-emerald-50/50 dark:border-emerald-500/20 dark:bg-emerald-950/20">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="size-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 flex items-center justify-center shrink-0">
                        <FileArchive className="size-6" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-dark-blue dark:text-white text-sm truncate">
                          Tệp đề bài đính kèm (.zip)
                        </p>
                        <p className="text-xs text-gray-navy/80 dark:text-light-blue/70 mt-0.5">
                          Học sinh có thể tải về tệp này khi xem và giải bài tập.
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={handleDownloadAttachment}
                      disabled={isDownloading}
                      className="rounded-xl shrink-0 font-bold flex items-center gap-2"
                    >
                      <Download className="size-4" />
                      {isDownloading ? "Đang mở..." : "Tải xuống đề bài"}
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-4 rounded-2xl border border-dashed border-gray-250 dark:border-white/10 bg-gray-50/50 dark:bg-zinc-900/30 text-xs text-gray-navy/70 dark:text-light-blue/60">
                    <span>Bài tập này hiện chưa có file nén đính kèm.</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditOpen(true)}
                      className="rounded-xl text-xs font-bold"
                    >
                      Thêm file đính kèm
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: AI Grading Status & Admin Info */}
            <div className="space-y-6">
              {/* AI Grading Status Box */}
              <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-4">
                <h3 className="text-base font-black text-dark-blue dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                  <Sparkles className="size-4 text-primary" />
                  Cấu hình chấm tự động AI
                </h3>

                {homework.grading_status === "READY" && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-sm">
                      <CheckCircle2 className="size-4 shrink-0" />
                      <span>Rubric đã sẵn sàng</span>
                    </div>
                    <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 leading-relaxed">
                      Hệ thống AI đã phân tích đề bài và thiết lập tiêu chí chấm tự động cho bài tập này. Mọi bài nộp sẽ được chấm ngay khi gửi lên.
                    </p>
                  </div>
                )}

                {homework.grading_status === "PROCESSING" && (
                  <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-sky-700 dark:text-sky-400 font-bold text-sm">
                      <Loader2 className="size-4 animate-spin shrink-0" />
                      <span>Đang phân tích rubric</span>
                    </div>
                    <p className="text-xs text-sky-800/80 dark:text-sky-300/80 leading-relaxed">
                      Worker AI đang phân tích nội dung đề bài và tài liệu đính kèm để tạo tiêu chí chấm. Vui lòng chờ giây lát.
                    </p>
                  </div>
                )}

                {homework.grading_status === "FAILED" && (
                  <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 space-y-3">
                    <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-sm">
                      <AlertTriangle className="size-4 shrink-0" />
                      <span>Khởi tạo rubric thất bại</span>
                    </div>
                    {homework.grading_error && (
                      <div className="rounded-xl bg-white/70 dark:bg-black/30 p-3 text-[11px] font-mono text-rose-800 dark:text-rose-300 break-words max-h-40 overflow-y-auto custom-scrollbar">
                        {homework.grading_error}
                      </div>
                    )}
                    <p className="text-xs text-rose-800/80 dark:text-rose-300/80 leading-relaxed">
                      💡 Bạn có thể bấm nút Sửa bài tập để cập nhật lại mô tả rõ ràng hơn, hệ thống sẽ tự động gửi yêu cầu phân tích lại rubric.
                    </p>
                    <Button
                      size="sm"
                      onClick={() => setIsEditOpen(true)}
                      className="w-full rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white"
                    >
                      Sửa bài tập để thử lại
                    </Button>
                  </div>
                )}

                {(!homework.grading_status || homework.grading_status === "PENDING") && (
                  <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 space-y-2">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-sm">
                      <Clock className="size-4 shrink-0" />
                      <span>Đang chờ phân tích</span>
                    </div>
                    <p className="text-xs text-amber-800/80 dark:text-amber-300/80 leading-relaxed">
                      Bài tập đang được xếp hàng chờ worker AI tiếp nhận phân tích đề bài.
                    </p>
                  </div>
                )}
              </div>

              {/* Assignment Metadata Box */}
              <div className="rounded-3xl bg-white dark:bg-navy-blue border border-gray-150 dark:border-white/10 p-6 shadow-sm space-y-3">
                <h3 className="text-base font-black text-dark-blue dark:text-white flex items-center gap-2 pb-2 border-b border-gray-100 dark:border-white/5">
                  <Layers className="size-4 text-primary" />
                  Thông tin bài tập
                </h3>

                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
                      Mã bài tập (ID):
                    </span>
                    <button
                      onClick={handleCopyId}
                      className="inline-flex items-center gap-1 font-mono text-[11px] bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-md text-dark-blue dark:text-light-blue hover:text-primary transition-colors cursor-pointer"
                      title="Bấm để copy ID"
                    >
                      <span>{homework.id.slice(0, 8)}...</span>
                      {copiedId ? <Check className="size-3 text-emerald-500" /> : <Copy className="size-3" />}
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
                      Bài học liên kết:
                    </span>
                    <span className="font-bold text-dark-blue dark:text-white truncate max-w-[160px]">
                      {lesson?.name || "Chưa phân loại"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-gray-navy/70 dark:text-light-blue/60 font-semibold">
                      Tổng số bài nộp:
                    </span>
                    <span className="font-extrabold text-primary">
                      {submissions.length} bài
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* TAB 2: SUBMISSIONS LIST */}
      {activeTab === "submissions" && (
        <motion.div
          key="tab-submissions"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-6"
        >
          {/* Aggregate Stats Cards */}
          <SubmissionsStats homework={homework} submissions={submissions} />

          {/* Submissions List Table & Inspector */}
          <SubmissionsList
            homework={homework}
            submissions={submissions}
            isLoading={isLoadingSubmissions}
          />
        </motion.div>
      )}

      {/* Edit Homework Form Modal */}
      <HomeworkFormModal
        open={isEditOpen}
        homework={homework}
        onClose={() => setIsEditOpen(false)}
      />

      {/* Confirm Archive Dialog */}
      <ConfirmDialog
        isOpen={isArchiveConfirmOpen}
        onClose={() => setIsArchiveConfirmOpen(false)}
        onConfirm={handleConfirmArchive}
        title="Lưu trữ bài tập này?"
        description={`Bạn có chắc chắn muốn lưu trữ bài tập "${homework.title}"? Học viên sẽ không thể xem hoặc nộp bài giải cho bài tập này nữa.`}
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
