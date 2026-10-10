"use client";

import { motion } from "framer-motion";
import {
  Archive,
  BookOpenCheck,
  Edit3,
  Eye,
  Plus,
  Search,
  GraduationCap,
  AlertCircle,
  Users,
  LayoutGrid,
  Table as TableIcon,
  ArrowUpDown,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  CodeXml,
} from "lucide-react";
import { useState, useMemo } from "react";
import Link from "next/link";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { HomeworkFormModal } from "@/features/homeworks/components/homework-form-modal";
import { HomeworkTable } from "@/features/homeworks/components/homework-table";
import {
  useArchiveHomework,
  useHomeworks,
} from "@/features/homeworks/queries";
import { Homework } from "@/features/homeworks/types";
import { useLessons } from "@/lib/queries";
import { LessonFilter } from "@/features/homeworks/components/lesson-filter";

type SortOption = "newest" | "oldest" | "most_submissions" | "least_submissions";

export default function TeacherHomeworksPage() {
  const { data, isLoading } = useHomeworks();
  const { data: lessons = [] } = useLessons();
  const archive = useArchiveHomework();

  const [editing, setEditing] = useState<Homework | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [archiveTarget, setArchiveTarget] = useState<Homework | null>(null);

  // Filters and views state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLessonId, setSelectedLessonId] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [viewMode, setViewMode] = useState<"grouped" | "table">("grouped");
  const [expandedLessons, setExpandedLessons] = useState<Record<string, boolean>>({});

  const archiveHomework = async (homework: Homework) => {
    setArchiveTarget(homework);
  };

  const handleConfirmArchive = async () => {
    if (!archiveTarget) return;
    try {
      await archive.mutateAsync(archiveTarget.id);
      toast.success("Đã lưu trữ bài tập thành công");
      setArchiveTarget(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Không thể lưu trữ");
    }
  };

  // Memoized stats calculations
  const stats = useMemo(() => {
    const list = data?.data || [];
    const totalHomeworks = list.length;
    const totalSubmissions = list.reduce((acc, h) => acc + (h.submitted_count || 0), 0);
    const lessonIds = new Set(list.map((h) => h.lesson_id).filter(Boolean));
    const lessonsWithHomeworks = lessonIds.size;

    return {
      totalHomeworks,
      totalSubmissions,
      lessonsWithHomeworks,
    };
  }, [data]);

  // Filtered and sorted homework list
  const processedHomeworks = useMemo(() => {
    const list = data?.data || [];
    const filtered = list.filter((h) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        h.title.toLowerCase().includes(q) || h.description.toLowerCase().includes(q);
      const matchesLesson = selectedLessonId === "" || h.lesson_id === selectedLessonId;
      return matchesSearch && matchesLesson;
    });

    return filtered.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "most_submissions") {
        return (b.submitted_count || 0) - (a.submitted_count || 0);
      }
      if (sortBy === "least_submissions") {
        return (a.submitted_count || 0) - (b.submitted_count || 0);
      }
      return 0;
    });
  }, [data, searchQuery, selectedLessonId, sortBy]);

  // Grouped by lesson
  const groupedHomeworks = useMemo(() => {
    const map = new Map<string, { lessonName: string; lessonId: string | null; homeworks: Homework[] }>();

    // Initial populate for lessons that have homeworks in the filtered list
    processedHomeworks.forEach((h) => {
      const key = h.lesson_id || "unassigned";
      const lessonObj = lessons.find((l) => l.id === h.lesson_id);
      const lessonName = lessonObj ? lessonObj.name : "Bài học chưa phân loại";

      if (!map.has(key)) {
        map.set(key, {
          lessonName,
          lessonId: h.lesson_id,
          homeworks: [],
        });
      }
      map.get(key)!.homeworks.push(h);
    });

    return Array.from(map.values());
  }, [processedHomeworks, lessons]);

  const toggleLessonExpand = (key: string) => {
    setExpandedLessons((prev) => ({
      ...prev,
      [key]: prev[key] === undefined ? false : !prev[key],
    }));
  };

  const isLessonExpanded = (key: string) => {
    // Default to true (expanded) if not explicitly collapsed
    return expandedLessons[key] !== false;
  };

  return (
    <div className="space-y-8 pb-14 text-left">
      {/* Top Header */}
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-1">
          <h1 className="flex items-center gap-3 text-3xl font-black text-dark-blue dark:text-white sm:text-4xl">
            <BookOpenCheck className="size-9 text-primary animate-pulse" /> Quản lý bài tập Coding
          </h1>
          <p className="text-gray-navy dark:text-light-blue/80 text-sm max-w-2xl">
            Tổ chức bài tập coding theo từng bài học và theo dõi tiến trình nộp bài của học viên.
          </p>
        </div>

        <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            className="shadow-md shadow-primary/20 h-11 px-5 rounded-2xl font-bold flex items-center gap-2"
          >
            <Plus className="size-4" /> Tạo bài tập mới
          </Button>
        </motion.div>
      </div>

      {/* KPI Stats Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Homeworks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
              Tổng số bài tập
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : stats.totalHomeworks} bài tập
            </p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center border border-primary/20">
            <BookOpenCheck className="size-6" />
          </div>
        </div>

        {/* Total Submissions */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
              Tổng lượt học viên đã nộp
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : stats.totalSubmissions} lượt nộp
            </p>
          </div>
          <div className="size-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Users className="size-6" />
          </div>
        </div>

        {/* Lessons with Homeworks */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-gray-navy/80 dark:text-light-blue/70">
              Bài học có bài tập
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : `${stats.lessonsWithHomeworks} / ${lessons.length}`} bài học
            </p>
          </div>
          <div className="size-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <GraduationCap className="size-6" />
          </div>
        </div>
      </div>

      {/* Filter, Search & View Controls Bar */}
      <div className="space-y-4">
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Tìm bài tập theo tiêu đề hoặc mô tả..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-250 bg-white text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 dark:border-white/20 dark:bg-zinc-900/60 dark:text-white"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap items-center gap-3">
            {/* Custom Lesson Filter Dropdown */}
            <LessonFilter
              lessons={lessons}
              selectedId={selectedLessonId}
              onChange={setSelectedLessonId}
            />

            {/* Sorting Dropdown */}
            <div className="relative min-w-[170px]">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
                aria-label="Sắp xếp bài tập"
                className="w-full h-11 px-3.5 rounded-xl border border-gray-250 bg-white dark:border-white/20 dark:bg-zinc-900/60 text-sm font-semibold text-dark-blue dark:text-white outline-none cursor-pointer focus:border-primary"
              >
                <option value="newest">Mới nhất trước</option>
                <option value="oldest">Cũ nhất trước</option>
                <option value="most_submissions">Nhiều bài nộp nhất</option>
                <option value="least_submissions">Ít bài nộp nhất</option>
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-gray-100 dark:bg-white/5 p-1 rounded-xl border border-gray-200 dark:border-white/10 shrink-0">
              <button
                onClick={() => setViewMode("grouped")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "grouped"
                    ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                    : "text-gray-navy/70 dark:text-light-blue/60 hover:text-dark-blue dark:hover:text-white"
                }`}
                title="Gom nhóm theo bài học"
              >
                <LayoutGrid className="size-3.5" />
                <span className="hidden sm:inline">Theo Bài học</span>
              </button>

              <button
                onClick={() => setViewMode("table")}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  viewMode === "table"
                    ? "bg-white dark:bg-navy-blue text-primary shadow-sm"
                    : "text-gray-navy/70 dark:text-light-blue/60 hover:text-dark-blue dark:hover:text-white"
                }`}
                title="Xem toàn bộ dạng bảng"
              >
                <TableIcon className="size-3.5" />
                <span className="hidden sm:inline">Bảng tổng hợp</span>
              </button>
            </div>
          </div>
        </div>

        {/* Results Count & Active Filter Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-navy dark:text-light-blue/70">
          <div>
            Hiển thị <strong className="text-primary">{processedHomeworks.length}</strong> trên tổng số{" "}
            <strong className="text-primary">{stats.totalHomeworks}</strong> bài tập
            {selectedLessonId && (
              <span className="ml-2 font-semibold">
                (Đang lọc: {lessons.find((l) => l.id === selectedLessonId)?.name})
              </span>
            )}
          </div>

          {(searchQuery || selectedLessonId) && (
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedLessonId("");
              }}
              className="text-primary hover:underline font-bold"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-navy-blue rounded-3xl border border-dashed border-gray-200 dark:border-white/10">
          <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-3" />
          <p className="text-sm font-semibold text-gray-navy dark:text-light-blue animate-pulse">
            Đang tải dữ liệu bài tập...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && processedHomeworks.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-200 p-16 text-center dark:border-white/20 bg-white/50 dark:bg-navy-blue/30">
          <AlertCircle className="mx-auto size-12 text-gray-300 dark:text-gray-navy mb-4" />
          <p className="font-bold text-dark-blue dark:text-white text-base">Không tìm thấy bài tập nào</p>
          <p className="mt-1 text-sm text-gray-navy dark:text-light-blue/70">
            {searchQuery || selectedLessonId
              ? "Hãy thử thay đổi từ khóa hoặc bộ lọc bài học."
              : "Bắt đầu bằng cách tạo một bài tập mới."}
          </p>
        </div>
      )}

      {/* VIEW MODE 1: Grouped by Lesson (User Request A1) */}
      {!isLoading && processedHomeworks.length > 0 && viewMode === "grouped" && (
        <div className="space-y-6">
          {groupedHomeworks.map((group) => {
            const groupKey = group.lessonId || "unassigned";
            const isExpanded = isLessonExpanded(groupKey);
            const totalGroupSubmissions = group.homeworks.reduce(
              (acc, h) => acc + (h.submitted_count || 0),
              0
            );

            return (
              <div
                key={groupKey}
                className="overflow-hidden rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-navy-blue shadow-sm transition-all"
              >
                {/* Lesson Header Accordion Bar */}
                <div
                  onClick={() => toggleLessonExpand(groupKey)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-gray-50/75 dark:bg-white/[0.02] border-b border-gray-200 dark:border-white/10 cursor-pointer hover:bg-gray-100/70 dark:hover:bg-white/[0.04] transition-colors gap-3 select-none"
                >
                  <div className="flex items-center gap-3">
                    <button className="text-gray-400 dark:text-light-blue/50">
                      {isExpanded ? (
                        <ChevronDown className="size-5" />
                      ) : (
                        <ChevronRight className="size-5" />
                      )}
                    </button>

                    <div className="size-9 rounded-xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center shrink-0 border border-primary/20">
                      <GraduationCap className="size-5" />
                    </div>

                    <div>
                      <h3 className="font-black text-dark-blue dark:text-white text-base sm:text-lg">
                        {group.lessonName}
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-gray-navy dark:text-light-blue/70 font-semibold mt-0.5">
                        <span>
                          <strong className="text-primary">{group.homeworks.length}</strong> bài tập
                        </span>
                        <span>•</span>
                        <span>
                          <strong className="text-indigo-600 dark:text-indigo-400">
                            {totalGroupSubmissions}
                          </strong>{" "}
                          lượt nộp
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto" onClick={(e) => e.stopPropagation()}>
                    {group.lessonId && (
                      <Link
                        href={`/teacher/lessons/${group.lessonId}/homeworks`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 text-xs font-bold border border-indigo-200 dark:border-indigo-900/40 transition-colors"
                        title="Vào trang quản lý bài tập chi tiết của bài học này"
                      >
                        <CodeXml className="size-3.5" />
                        <span>Xem chi tiết bài học</span>
                        <ExternalLink className="size-3" />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Table Content inside Group */}
                {isExpanded && (
                  <div className="p-3 sm:p-4">
                    <HomeworkTable
                      homeworks={group.homeworks}
                      lessons={lessons}
                      showLessonColumn={false}
                      pageSize={20}
                      onEdit={(hw) => {
                        setEditing(hw);
                        setFormOpen(true);
                      }}
                      onArchive={(hw) => archiveHomework(hw)}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW MODE 2: Unified Flat Table */}
      {!isLoading && processedHomeworks.length > 0 && viewMode === "table" && (
        <HomeworkTable
          homeworks={processedHomeworks}
          lessons={lessons}
          showLessonColumn={true}
          pageSize={10}
          onEdit={(hw) => {
            setEditing(hw);
            setFormOpen(true);
          }}
          onArchive={(hw) => archiveHomework(hw)}
        />
      )}

      {/* Modular Modals */}
      <HomeworkFormModal
        open={formOpen}
        homework={editing}
        onClose={() => setFormOpen(false)}
      />

      {/* Confirm Archive Modal */}
      <ConfirmDialog
        isOpen={!!archiveTarget}
        onClose={() => setArchiveTarget(null)}
        onConfirm={handleConfirmArchive}
        title="Lưu trữ bài tập này?"
        description={
          archiveTarget
            ? `Bạn có chắc chắn muốn lưu trữ bài tập "${archiveTarget.title}"? Học viên sẽ không thể xem hoặc nộp bài giải cho bài tập này nữa.`
            : ""
        }
        confirmText="Xác nhận lưu trữ"
        cancelText="Hủy bỏ"
        isDestructive={true}
      />
    </div>
  );
}
