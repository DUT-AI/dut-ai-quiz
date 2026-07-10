"use client";

import { useState, useMemo } from "react";
import { useLessons, useDeleteLesson } from "@/lib/queries";
import type { Lesson } from "@/lib/types";
import { LessonFormModal, TeacherLessonRow } from "@/features/lessons/components";
import { AnimatePresence, motion } from "framer-motion";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen, Sparkles, AlertCircle, Plus, ClipboardList, Layers } from "lucide-react";

export default function LessonsPage() {
  const { data: lessons, isLoading, error } = useLessons();
  const deleteMut = useDeleteLesson();
  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons
      .filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => a.order - b.order); // Keep sorted by order for better user experience
  }, [lessons, searchQuery]);

  // Compute stats metrics
  const totalLessons = lessons?.length || 0;
  const nextOrder = useMemo(() => {
    if (!lessons || lessons.length === 0) return 1;
    return Math.max(...lessons.map((l) => l.order)) + 1;
  }, [lessons]);

  const latestLesson = useMemo(() => {
    if (!lessons || lessons.length === 0) return null;
    return [...lessons].sort((a, b) => b.order - a.order)[0];
  }, [lessons]);

  return (
    <div className="w-full space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
        <div className="text-left space-y-2">
          <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800 dark:text-white tracking-tight flex items-center gap-3">
            <ClipboardList className="size-8 text-primary" />
            Quản lý <span className="text-primary">Bài học</span>
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-sm max-w-xl">
            Tạo mới, chỉnh sửa nội dung bài học và cấu trúc sơ đồ câu hỏi luyện tập cho học viên.
          </p>
        </div>
        
        <button
          onClick={() => setShowCreate(true)}
          className="px-5 py-3 bg-primary hover:bg-primary/95 text-white dark:text-slate-950 font-bold rounded-2xl text-xs md:text-sm transition-all duration-300 flex items-center gap-2 shrink-0 self-start md:self-auto shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
        >
          <Plus className="size-4 md:size-5" />
          <span>Thêm bài học mới</span>
        </button>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Lessons Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center justify-between text-left"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Tổng số chương
            </p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {isLoading ? "..." : totalLessons} bài học
            </p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="size-6" />
          </div>
        </motion.div>

        {/* Next Order Suggestion Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center justify-between text-left"
        >
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Thứ tự tiếp theo
            </p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              Chương số {isLoading ? "..." : nextOrder}
            </p>
          </div>
          <div className="size-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
            <Layers className="size-6" />
          </div>
        </motion.div>

        {/* Latest Lesson Card */}
        <motion.div
          whileHover={{ y: -2 }}
          className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center justify-between text-left sm:col-span-2 lg:col-span-1"
        >
          <div className="space-y-1 w-full max-w-[200px] lg:max-w-none">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Bài học mới nhất
            </p>
            <p className="text-lg font-black text-slate-800 dark:text-white truncate" title={latestLesson?.name || "Chưa có bài học"}>
              {isLoading ? "..." : latestLesson ? latestLesson.name : "Chưa có"}
            </p>
          </div>
          <div className="size-12 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0">
            <Sparkles className="size-6" />
          </div>
        </motion.div>
      </div>

      {/* Search Bar */}
      <div className="w-full">
        <SearchBar
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onClear={() => setSearchQuery("")}
          placeholder="Nhập tên bài học cần tìm kiếm..."
          containerClassName="max-w-none"
        />
      </div>

      {/* Main List Area */}
      <div className="w-full">
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-24 bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold text-slate-500 dark:text-zinc-400 text-sm">
              Đang tải danh sách bài học...
            </p>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-950/50 text-center">
            <AlertCircle className="size-10 mb-2" />
            <p className="font-bold text-sm">Lỗi xảy ra khi tải dữ liệu bài học</p>
            <p className="text-xs opacity-80 mt-1">
              {error instanceof Error ? error.message : "Đã có lỗi hệ thống xảy ra."}
            </p>
          </div>
        )}

        {!isLoading && !error && (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {/* Empty state: No lessons in database */}
              {lessons?.length === 0 && !showCreate && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800"
                >
                  <BookOpen className="size-16 text-slate-300 dark:text-zinc-700 mb-4 animate-pulse" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Chưa có bài học nào
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                    Hệ thống hiện tại chưa cấu hình bài học nào cho khóa học này. Hãy tạo bài học đầu tiên ngay.
                  </p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="mt-5 px-5 py-2.5 bg-primary text-white dark:text-slate-950 font-bold rounded-xl text-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  >
                    Tạo bài học đầu tiên
                  </button>
                </motion.div>
              )}

              {/* Empty state: Search query yielded no results */}
              {lessons && lessons.length > 0 && filteredLessons.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.98 }}
                  className="flex flex-col items-center justify-center py-16 text-center bg-white dark:bg-zinc-900 rounded-3xl border border-dashed border-slate-200 dark:border-zinc-800"
                >
                  <AlertCircle className="size-16 text-slate-300 dark:text-zinc-700 mb-4" />
                  <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                    Không tìm thấy kết quả phù hợp
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mt-1 max-w-sm">
                    Không tìm thấy bài học nào khớp với từ khóa &quot;{searchQuery}&quot;. Hãy thử nhập từ khóa khác.
                  </p>
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-xs font-extrabold text-primary hover:underline cursor-pointer"
                  >
                    Xóa bộ lọc tìm kiếm
                  </button>
                </motion.div>
              )}

              {/* Lesson Items */}
              {filteredLessons.map((l, index) => (
                <TeacherLessonRow
                  key={l.id}
                  lesson={l}
                  index={index}
                  onEdit={() => setEditingLesson(l)}
                  onDelete={() => setDeletingLesson(l)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals and Overlays */}
      <AnimatePresence>
        {showCreate && (
          <LessonFormModal onClose={() => setShowCreate(false)} />
        )}
        {editingLesson && (
          <LessonFormModal
            initialData={editingLesson}
            onClose={() => setEditingLesson(null)}
          />
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={!!deletingLesson}
        title="Xoá bài học"
        description={`Bạn có chắc chắn muốn xoá bài học "${deletingLesson?.name}"?\nCác câu hỏi trong bài học sẽ bị gỡ liên kết.`}
        confirmLabel="Xoá ngay"
        cancelLabel="Hủy"
        variant="danger"
        isLoading={deleteMut.isPending}
        onConfirm={async () => {
          if (deletingLesson) {
            try {
              await deleteMut.mutateAsync(deletingLesson.id);
            } catch (err) {
              console.error(err);
            } finally {
              setDeletingLesson(null);
            }
          }
        }}
        onCancel={() => setDeletingLesson(null)}
      />
    </div>
  );
}
