"use client";

import { useState } from "react";
import Link from "next/link";
import { useLessons, useDeleteLesson } from "@/lib/queries";
import type { Lesson } from "@/lib/types";
import { LessonFormModal } from "@/features/lessons/components";
import { AnimatePresence } from "framer-motion";

/* ─── Row bài học ──────────────────────────────────────── */
interface LessonRowProps {
  lesson: Lesson;
  onEdit: () => void;
}

function LessonRow({ lesson, onEdit }: LessonRowProps) {
  const deleteMut = useDeleteLesson();

  return (
    <div className="rounded-xl bg-white dark:bg-slate/20 border border-slate/10 dark:border-white/10 overflow-hidden">
      <div className="flex items-center gap-4 p-4">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold text-sm shrink-0">
          {lesson.order}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="font-semibold text-dark-blue dark:text-white text-sm">
            {lesson.name}
          </p>
          {lesson.description && (
            <p className="text-xs text-gray-navy dark:text-light-blue mt-0.5 truncate">
              {lesson.description}
            </p>
          )}
        </div>
        <div className="flex gap-2 shrink-0">
          <Link
            href={`/teacher/lessons/${lesson.id}/questions`}
            className="text-xs px-2 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition font-medium"
          >
            Câu hỏi
          </Link>
          <button
            onClick={onEdit}
            className="text-xs px-2 py-1 rounded bg-slate/10 hover:bg-slate/20 dark:bg-white/10 dark:hover:bg-white/20 transition font-medium"
          >
            Sửa
          </button>
          <button
            onClick={() => {
              if (confirm(`Xoá bài học "${lesson.name}"?\nCác câu hỏi trong bài sẽ bị bỏ liên kết.`)) {
                deleteMut.mutate(lesson.id);
              }
            }}
            className="text-xs px-2 py-1 rounded bg-red/10 text-red hover:bg-red/20 transition font-medium"
          >
            Xoá
          </button>
        </div>
      </div>
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────── */
export default function LessonsPage() {
  const { data: lessons, isLoading, error } = useLessons();
  const [showCreate, setShowCreate] = useState(false);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-dark-blue dark:text-white">
          Bài học
        </h1>
        <button
          onClick={() => setShowCreate(true)}
          className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary/80 transition"
        >
          + Thêm bài học
        </button>
      </div>

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

      {isLoading && (
        <p className="text-sm text-gray-navy dark:text-light-blue text-left">Đang tải…</p>
      )}
      {error && (
        <p className="text-red text-sm text-left">
          {error instanceof Error ? error.message : "Lỗi"}
        </p>
      )}

      <div className="space-y-2">
        {lessons?.length === 0 && !showCreate && (
          <p className="text-center text-gray-navy dark:text-light-blue text-sm py-10">
            Chưa có bài học nào. Hãy tạo bài học đầu tiên!
          </p>
        )}
        {lessons?.map((l) => (
          <LessonRow key={l.id} lesson={l} onEdit={() => setEditingLesson(l)} />
        ))}
      </div>
    </div>
  );
}
