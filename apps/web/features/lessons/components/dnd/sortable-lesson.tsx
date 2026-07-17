"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, BookOpen, Edit2, Trash2 } from "lucide-react";
import type { Lesson } from "@/features/lessons/types";

interface Props {
  lesson: Lesson;
  onEdit: () => void;
  onDelete: () => void;
}

export function SortableLesson({ lesson, onEdit, onDelete }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `lesson-${lesson.id}`, data: { type: "Lesson", lesson } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative flex flex-col p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl group hover:shadow-md transition-shadow ${
        isDragging ? "opacity-50 z-50 ring-2 ring-primary" : ""
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 flex-1 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="mt-0.5 p-1 text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing rounded"
          >
            <GripVertical className="size-4" />
          </button>
          <div className="flex-1 min-w-0">
            <h4 className="font-bold text-sm text-slate-800 dark:text-white truncate">
              {lesson.name}
            </h4>
            {lesson.description && (
              <p className="text-xs text-slate-500 dark:text-zinc-400 truncate mt-1">
                {lesson.description}
              </p>
            )}
          </div>
        </div>
      </div>
      
      {/* Actions */}
      <div className="flex items-center justify-end gap-1 mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={onEdit}
          className="p-1.5 text-xs text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/30 rounded-md transition-colors"
        >
          <Edit2 className="size-3.5" />
        </button>
        <button
          onClick={onDelete}
          className="p-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/30 rounded-md transition-colors"
        >
          <Trash2 className="size-3.5" />
        </button>
      </div>
    </div>
  );
}
