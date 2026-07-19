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
      <div className="flex items-center gap-2.5 mb-4 pl-1">
        <h3 className="text-lg font-extrabold text-dark-blue dark:text-white flex items-center gap-2">
          <AlertCircle className="size-5 text-amber-500" />
          Bài học chưa phân loại
        </h3>
        <span className="px-2.5 py-0.5 rounded-full bg-amber-500/10 dark:bg-amber-500/20 border border-amber-550/20 text-xs font-bold text-amber-600 dark:text-amber-400 shadow-sm">
          {lessons.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={`w-full min-h-[150px] p-5 rounded-3xl bg-amber-500/[0.02] dark:bg-amber-500/[0.03] border-2 border-dashed transition-all duration-300 flex flex-col gap-3 ${
          isOver 
            ? "border-primary bg-primary/10 dark:bg-primary/5 shadow-inner" 
            : "border-gray-200 dark:border-amber-500/20 hover:border-amber-500/40 dark:hover:border-amber-500/35"
        }`}
      >
        <SortableContext 
          items={lessons.map((l) => `lesson-${l.id}`)} 
          strategy={verticalListSortingStrategy}
        >
          {lessons.length === 0 ? (
            <div className="w-full min-h-[110px] flex items-center justify-center text-sm text-gray-navy/60 dark:text-light-blue/50 italic">
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

