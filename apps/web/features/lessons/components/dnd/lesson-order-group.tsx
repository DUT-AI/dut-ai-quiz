"use client";

import { useSortable, SortableContext, horizontalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
      className={`flex flex-col gap-2 w-full ${isDragging ? "opacity-50" : ""}`}
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider pl-2">
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing hover:bg-slate-200 dark:hover:bg-zinc-700 p-0.5 rounded"
          title="Kéo thả để thay đổi thứ tự nhóm"
        >
          <span className="flex items-center justify-center size-5 rounded-full bg-slate-100 dark:bg-zinc-800 text-[10px]">
            {order}
          </span>
        </button>
        Học song song
      </div>
      
      <div
        ref={setNodeRef}
        className={`w-full min-h-[100px] p-3 rounded-2xl bg-slate-50/50 dark:bg-zinc-900/50 border-2 border-dashed transition-colors flex flex-row flex-wrap gap-3 ${
          isOver ? "border-primary bg-primary/5 dark:bg-primary/5" : "border-slate-200 dark:border-zinc-800"
        }`}
      >
        <SortableContext 
          items={lessons.map((l) => `lesson-${l.id}`)} 
          strategy={horizontalListSortingStrategy}
        >
          {lessons.map((lesson) => (
            <div key={lesson.id} className="w-full sm:w-[calc(50%-6px)] lg:w-[calc(33.333%-8px)]">
              <SortableLesson
                lesson={lesson}
                onEdit={() => onEdit(lesson)}
                onDelete={() => onDelete(lesson)}
              />
            </div>
          ))}
          
          {lessons.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-sm text-slate-400 dark:text-zinc-600 italic">
              Kéo thả bài học vào đây
            </div>
          )}
        </SortableContext>
      </div>
    </div>
  );
}
