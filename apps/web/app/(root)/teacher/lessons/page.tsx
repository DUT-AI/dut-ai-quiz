"use client";

import { useState, useMemo } from "react";
import { useLessons, useModules, useDeleteLesson, useReorderModules, useReorderLessons } from "@/features/lessons/queries";
import type { Lesson } from "@/features/lessons/types";
import { LessonFormModal } from "@/features/lessons/components/lesson-form-modal";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen, AlertCircle, Plus, ClipboardList, Layers } from "lucide-react";
import { LessonDndContext } from "@/features/lessons/components/dnd/lesson-dnd-context";

export default function LessonsPage() {
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useLessons();
  const { data: modules, isLoading: modulesLoading } = useModules();
  
  const reorderModulesMut = useReorderModules();
  const reorderLessonsMut = useReorderLessons();
  const deleteMut = useDeleteLesson();
  
  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = lessonsLoading || modulesLoading;

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lessons, searchQuery]);

  const totalLessons = lessons?.length || 0;
  
  const nextOrder = useMemo(() => {
    if (!lessons || lessons.length === 0) return 1;
    return Math.max(...lessons.map((l) => l.order)) + 1;
  }, [lessons]);

  const handleModulesReorder = (moduleIds: string[]) => {
    reorderModulesMut.mutate({ module_ids: moduleIds });
  };

  const handleLessonsReorder = (updatedLessons: { id: string; order: number; module_id: string | null }[]) => {
    reorderLessonsMut.mutate({ items: updatedLessons });
  };

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
            Tạo mới, chỉnh sửa nội dung bài học và sắp xếp cấu trúc chương trình học qua các Module. Kéo thả để sắp xếp lại.
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
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 dark:text-zinc-500">
              Tổng số bài học
            </p>
            <p className="text-2xl font-black text-slate-800 dark:text-white">
              {isLoading ? "..." : totalLessons} bài học
            </p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
            <BookOpen className="size-6" />
          </div>
        </div>

        {/* Next Order Suggestion Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800/80 shadow-sm flex items-center justify-between text-left">
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
        </div>
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
              Đang tải danh sách bài học và module...
            </p>
          </div>
        )}

        {lessonsError && (
          <div className="flex flex-col items-center justify-center p-8 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-2xl border border-rose-100 dark:border-rose-950/50 text-center">
            <AlertCircle className="size-10 mb-2" />
            <p className="font-bold text-sm">Lỗi xảy ra khi tải dữ liệu</p>
            <p className="text-xs opacity-80 mt-1">
              {lessonsError instanceof Error ? lessonsError.message : "Đã có lỗi hệ thống xảy ra."}
            </p>
          </div>
        )}

        {!isLoading && !lessonsError && modules && lessons && (
          <div className="space-y-3">
            {searchQuery ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm text-slate-500 dark:text-zinc-400 mb-2">Kết quả tìm kiếm ({filteredLessons.length}):</p>
                {/* Search result view - just simple list */}
                {filteredLessons.map((l) => (
                   <div key={l.id} className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl">
                      <h4 className="font-bold text-sm text-slate-800 dark:text-white">{l.name}</h4>
                      <p className="text-xs text-slate-500 mt-1">Thuộc module: {modules.find(m => m.id === l.module_id)?.name || "Chưa phân loại"}</p>
                   </div>
                ))}
                {filteredLessons.length === 0 && (
                  <div className="text-center py-10 text-slate-500">Không tìm thấy kết quả phù hợp.</div>
                )}
              </div>
            ) : (
              <LessonDndContext
                modules={modules}
                lessons={lessons}
                onModulesReorder={handleModulesReorder}
                onLessonsReorder={handleLessonsReorder}
                onEditLesson={setEditingLesson}
                onDeleteLesson={setDeletingLesson}
              />
            )}
          </div>
        )}
      </div>

      {showCreate && (
        <LessonFormModal onClose={() => setShowCreate(false)} />
      )}
      {editingLesson && (
        <LessonFormModal
          initialData={editingLesson}
          onClose={() => setEditingLesson(null)}
        />
      )}

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
