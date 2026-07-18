"use client";

import { GripVertical, BookOpen, Edit2, Trash2, HelpCircle } from "lucide-react";
import Link from "next/link";
import type { Lesson } from "@/features/lessons/types";

interface LessonCardProps {
  lesson: Lesson;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: any;
  isDragging?: boolean;
  showGrip?: boolean;
}

export function LessonCard({
  lesson,
  onEdit,
  onDelete,
  dragHandleProps = {},
  isDragging = false,
  showGrip = true,
}: LessonCardProps) {
  return (
    <div
      className={`relative flex flex-col p-4 bg-white dark:bg-dark-blue/70 border border-gray-200 dark:border-white/15 rounded-2xl shadow-sm dark:shadow-[0_4px_12px_rgba(0,0,0,0.25)] hover:shadow-md dark:hover:shadow-[0_6px_16px_rgba(0,0,0,0.45)] hover:border-emerald-500/40 dark:hover:border-emerald-500/50 hover:bg-gray-50/50 dark:hover:bg-dark-blue/90 transition-all duration-300 group ${
        isDragging ? "opacity-50 z-50 ring-2 ring-primary border-primary" : ""
      }`}
    >
      <div className="flex items-start gap-3 flex-1 min-w-0">
        {showGrip && (
          <button
            {...dragHandleProps}
            className="mt-0.5 p-1.5 text-gray-navy/60 hover:text-gray-navy dark:text-light-blue/50 dark:hover:text-light-blue hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg cursor-grab active:cursor-grabbing transition-colors duration-200 shrink-0"
            title="Kéo thả để sắp xếp bài học"
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <div className="size-8 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
          <BookOpen className="size-4" />
        </div>

        <div className="flex-1 min-w-0">
          <h4 className="font-extrabold text-sm text-dark-blue dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors duration-200 line-clamp-1">
            {lesson.name}
          </h4>
          {lesson.description ? (
            <p className="text-xs text-gray-navy dark:text-light-blue mt-1 line-clamp-2 leading-relaxed">
              {lesson.description}
            </p>
          ) : (
            <p className="text-xs text-gray-navy/60 dark:text-light-blue/40 mt-1 italic">
              Chưa có mô tả cho bài học này
            </p>
          )}
        </div>
      </div>

      {/* Actions section */}
      {(onEdit || onDelete) && (
        <div className="flex items-center justify-end gap-1.5 mt-4 pt-3 border-t border-gray-100 dark:border-white/5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
          <Link
            href={`/teacher/lessons/${lesson.id}/questions`}
            className="px-2.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500 text-emerald-600 hover:text-white dark:text-emerald-400 dark:hover:text-navy-blue font-bold rounded-lg text-[10px] md:text-[11px] transition-all duration-200 flex items-center gap-1 border border-emerald-500/20 shadow-sm"
          >
            <HelpCircle className="size-3.5" />
            <span className="font-bold">Câu hỏi</span>
          </Link>
          {onEdit && (
            <button
              onClick={onEdit}
              className="p-1.5 text-indigo-650 hover:text-white hover:bg-indigo-500 dark:text-indigo-400 dark:hover:text-navy-blue dark:hover:bg-indigo-400 rounded-lg border border-indigo-500/10 dark:border-indigo-400/20 transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center"
              title="Chỉnh sửa bài học"
            >
              <Edit2 className="size-3.5" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              className="p-1.5 text-rose-650 hover:text-white hover:bg-rose-500 dark:text-rose-400 dark:hover:text-white dark:hover:bg-rose-600 rounded-lg border border-rose-500/10 dark:border-rose-500/20 transition-all duration-200 shadow-sm cursor-pointer flex items-center justify-center"
              title="Xóa bài học"
            >
              <Trash2 className="size-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
