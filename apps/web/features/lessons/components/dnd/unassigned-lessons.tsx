"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { SortableLesson } from "./sortable-lesson";
import type { Lesson } from "@/features/lessons/types";
import { AlertCircle } from "lucide-react";

interface Props {
  lessons: Lesson[];
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
}

export function UnassignedLessons({ lessons, onEditLesson, onDeleteLesson }: Props) {
  const { setNodeRef, isOver } = useDroppable({
    id: "unassigned-lessons-area",
    data: {
      type: "UnassignedArea",
    },
  });

  return (
    <div className="w-full mt-8">
      <div className="flex items-center gap-2 mb-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <AlertCircle className="size-5 text-slate-400" />
          Bài học chưa phân loại
        </h3>
        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-xs font-bold text-slate-500">
          {lessons.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`w-full min-h-[150px] p-4 rounded-3xl bg-slate-50 dark:bg-zinc-900/30 border-2 border-dashed transition-colors flex flex-col gap-3 ${
          isOver ? "border-primary bg-primary/5" : "border-slate-200 dark:border-zinc-800"
        }`}
      >
        <SortableContext 
          items={lessons.map((l) => `lesson-${l.id}`)} 
          strategy={verticalListSortingStrategy}
        >
          {lessons.length === 0 ? (
            <div className="w-full h-full min-h-[100px] flex items-center justify-center text-sm text-slate-400 dark:text-zinc-500 italic">
              Không có bài học nào chưa được phân loại.
            </div>
          ) : (
            lessons.map((lesson) => (
              <SortableLesson
                key={lesson.id}
                lesson={lesson}
                onEdit={() => onEditLesson(lesson)}
                onDelete={() => onDeleteLesson(lesson)}
              />
            ))
          )}
        </SortableContext>
      </div>
    </div>
  );
}
