"use client";

import { useSortable, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Layers } from "lucide-react";
import { SortableLesson } from "./sortable-lesson";
import type { Lesson } from "@/features/lessons/types";

interface Props {
  order: number;
  moduleId: string | null;
  lessons: Lesson[];
  onEdit: (lesson: Lesson) => void;
  onDelete: (lesson: Lesson) => void;
}

export function LessonOrderGroup({ order, moduleId, lessons, onEdit, onDelete }: Props) {
  const id = `order-group-${moduleId || "unassigned"}-${order}`;
  const { setNodeRef, attributes, listeners, transform, transition, isDragging, isOver } = useSortable({
    id,
    data: {
      type: "OrderGroup",
      order,
      moduleId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`flex flex-col gap-2.5 w-full ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-gray-navy dark:text-light-blue uppercase tracking-widest pl-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-gray-150 dark:hover:bg-white/5 p-1 rounded-lg transition-colors flex items-center justify-center"
          title="Kéo thả để thay đổi thứ tự nhóm"
        >
          <span className="flex items-center justify-center size-5 rounded-md bg-indigo-500/10 dark:bg-indigo-500/25 border border-indigo-500/20 text-indigo-650 dark:text-indigo-400 text-[10px] font-extrabold shadow-sm">
            {order}
          </span>
        </button>
        <span className="flex items-center gap-1 text-[11px] font-black text-dark-blue dark:text-white/80">
          <Layers className="size-3.5 text-indigo-550" />
          Học song song
        </span>
      </div>
      
      <div
        ref={setNodeRef}
        className={`w-full min-h-[110px] p-4 rounded-2xl bg-gray-50/40 dark:bg-black/35 border-2 border-dashed transition-all duration-300 flex flex-row flex-wrap gap-4 ${
          isOver 
            ? "border-primary bg-primary/10 dark:bg-primary/5 shadow-inner" 
            : "border-gray-255 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/25"
        }`}
      >
        <SortableContext 
          items={lessons.map((l) => `lesson-${l.id}`)} 
          strategy={horizontalListSortingStrategy}
        >
          {lessons.map((lesson) => (
            <div key={lesson.id} className="w-full sm:w-[calc(50%-8px)] lg:w-[calc(33.333%-11px)]">
              <SortableLesson
                lesson={lesson}
                onEdit={() => onEdit(lesson)}
                onDelete={() => onDelete(lesson)}
              />
            </div>
          ))}
          
          {lessons.length === 0 && (
            <div className="w-full min-h-[70px] flex items-center justify-center text-sm text-gray-navy/60 dark:text-light-blue/50 italic">
              Kéo thả bài học vào đây để sắp xếp
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
