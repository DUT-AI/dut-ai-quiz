"use client";

import { useState, useMemo } from "react";
import { useLessons, useModules, useDeleteLesson, useReorderModules, useReorderLessons, useDeleteModule } from "@/features/lessons/queries";
import type { Lesson, Module } from "@/features/lessons/types";
import { LessonFormModal } from "@/features/lessons/components/lesson-form-modal";
import { ModuleFormModal } from "@/features/lessons/components/module-form-modal";
import { ConfirmModal } from "@/components/molecules/confirm-modal";
import { SearchBar } from "@/components/ui/search-bar";
import { BookOpen, AlertCircle, Plus, ClipboardList, Layers, Folder } from "lucide-react";
import Link from "next/link";
import { LessonDndContext } from "@/features/lessons/components/dnd/lesson-dnd-context";
import { LessonCard } from "@/features/lessons/components/dnd/lesson-card";

export default function LessonsPage() {
  const { data: lessons, isLoading: lessonsLoading, error: lessonsError } = useLessons();
  const { data: modules, isLoading: modulesLoading } = useModules();

  const reorderModulesMut = useReorderModules();
  const reorderLessonsMut = useReorderLessons();
  const deleteMut = useDeleteLesson();
  const deleteModuleMut = useDeleteModule();

  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [deletingLesson, setDeletingLesson] = useState<Lesson | null>(null);

  const [showCreateModule, setShowCreateModule] = useState(false);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [deletingModule, setDeletingModule] = useState<Module | null>(null);

  const [searchQuery, setSearchQuery] = useState("");

  const isLoading = lessonsLoading || modulesLoading;

  const filteredLessons = useMemo(() => {
    if (!lessons) return [];
    return lessons.filter((l) => l.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [lessons, searchQuery]);

  const totalLessons = lessons?.length || 0;

  const unassignedCount = useMemo(() => {
    if (!lessons) return 0;
    return lessons.filter((l) => !l.module_id).length;
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
            Tạo mới, chỉnh sửa nội dung bài học và sắp xếp cấu trúc chương trình học qua các Module.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowCreateModule(true)}
            className="px-5 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-bold rounded-2xl text-xs md:text-sm transition-all duration-300 flex items-center gap-2 shrink-0 self-start md:self-auto shadow-lg shadow-indigo-500/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Folder className="size-4 md:size-5" />
            <span>Thêm Chương</span>
          </button>
          <Link
            href="/teacher/lessons/new"
            className="px-5 py-3 bg-primary hover:bg-primary/95 text-white dark:text-slate-950 font-bold rounded-2xl text-xs md:text-sm transition-all duration-300 flex items-center gap-2 shrink-0 self-start md:self-auto shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 cursor-pointer"
          >
            <Plus className="size-4 md:size-5" />
            <span>Thêm bài học mới</span>
          </Link>
        </div>
      </div>

      {/* Metrics Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Total Lessons Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-gray-300 dark:hover:border-white/15 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-navy/80 dark:text-light-blue/70">
              Tổng số bài học
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : totalLessons} bài học
            </p>
          </div>
          <div className="size-12 rounded-xl bg-primary/10 dark:bg-emerald-500/10 text-primary dark:text-emerald-400 flex items-center justify-center border border-primary/20 dark:border-emerald-500/20">
            <BookOpen className="size-6" />
          </div>
        </div>

        {/* Total Chapters Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-gray-300 dark:hover:border-white/15 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-navy/80 dark:text-light-blue/70">
              Tổng số chương học
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : modules?.length || 0} chương
            </p>
          </div>
          <div className="size-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
            <Folder className="size-6" />
          </div>
        </div>

        {/* Unassigned Lessons Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 shadow-md dark:shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:border-gray-300 dark:hover:border-white/15 transition-all duration-300 flex items-center justify-between text-left">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-navy/80 dark:text-light-blue/70">
              Bài học chưa phân loại
            </p>
            <p className="text-2xl font-black text-dark-blue dark:text-white">
              {isLoading ? "..." : unassignedCount} bài học
            </p>
          </div>
          <div className="size-12 rounded-xl bg-amber-500/10 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center border border-amber-500/20">
            <AlertCircle className="size-6" />
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
              <div className="flex flex-col gap-4">
                <p className="text-sm font-bold text-gray-navy dark:text-light-blue mb-1 pl-1">
                  Kết quả tìm kiếm ({filteredLessons.length}):
                </p>
                {/* Search result view - utilizing reusable LessonCard */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredLessons.map((l) => (
                    <div key={l.id} className="flex flex-col gap-2">
                      <LessonCard
                        lesson={l}
                        onEdit={() => setEditingLesson(l)}
                        onDelete={() => setDeletingLesson(l)}
                        showGrip={false}
                      />
                      <p className="text-[10px] md:text-xs text-gray-navy/60 dark:text-light-blue/50 px-3 font-semibold uppercase tracking-wider">
                        Thuộc chương: {modules.find(m => m.id === l.module_id)?.name || "Chưa phân loại"}
                      </p>
                    </div>
                  ))}
                </div>
                {filteredLessons.length === 0 && (
                  <div className="text-center py-16 text-gray-navy dark:text-light-blue border border-dashed border-gray-250 dark:border-white/5 rounded-3xl bg-gray-50/20 dark:bg-navy-blue/15">
                    Không tìm thấy kết quả phù hợp cho &quot;{searchQuery}&quot;.
                  </div>
                )}
              </div>
            ) : (
              <LessonDndContext
                modules={modules}
                lessons={lessons}
                onModulesReorder={handleModulesReorder}
                onLessonsReorder={handleLessonsReorder}
                onEditModule={setEditingModule}
                onDeleteModule={setDeletingModule}
                onEditLesson={setEditingLesson}
                onDeleteLesson={setDeletingLesson}
              />
            )}
          </div>
        )}
      </div>

      {/* Module Modals */}
      {(showCreateModule || editingModule) && (
        <ModuleFormModal
          initialData={editingModule || undefined}
          onClose={() => {
            setShowCreateModule(false);
            setEditingModule(null);
          }}
        />
      )}
      {deletingModule && (
        <ConfirmModal
          isOpen={!!deletingModule}
          title="Xác nhận xóa chương"
          description={`Bạn có chắc chắn muốn xóa chương "${deletingModule.name}" không? Các bài học trong chương này sẽ trở thành chưa phân loại.`}
          confirmLabel="Xóa chương"
          cancelLabel="Hủy"
          variant="danger"
          isLoading={deleteModuleMut.isPending}
          onConfirm={async () => {
            if (deletingModule) {
              await deleteModuleMut.mutateAsync(deletingModule.id);
              setDeletingModule(null);
            }
          }}
          onCancel={() => setDeletingModule(null)}
        />
      )}

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
