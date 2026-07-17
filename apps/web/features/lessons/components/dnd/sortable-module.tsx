"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, Folder, ChevronDown, ChevronRight, Plus } from "lucide-react";
import { useState } from "react";
import type { Module, Lesson } from "@/features/lessons/types";
import { LessonOrderGroup } from "./lesson-order-group";

function InsertDropZone({ id, order, moduleId }: { id: string; order: number; moduleId: string }) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: { type: "InsertZone", order, moduleId },
  });
  return (
    <div
      ref={setNodeRef}
      className={`h-3 w-full -my-3 rounded-full transition-all z-10 relative ${
        isOver ? "bg-primary opacity-100 scale-y-150" : "bg-transparent opacity-0 hover:bg-primary/50"
      }`}
    />
  );
}

interface Props {
  module: Module;
  lessons: Lesson[];
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
}

export function SortableModule({ module, lessons, onEditLesson, onDeleteLesson }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: `module-${module.id}`, data: { type: "Module", module } });

  const { active } = useDndContext();
  const isDraggingLesson = active?.data.current?.type === "Lesson";

  const { setNodeRef: setDropRef, isOver: isDropOver } = useDroppable({
    id: `module-drop-${module.id}`,
    data: { type: "Module", module }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Group lessons by order
  const lessonsByOrder = lessons.reduce((acc, lesson) => {
    const order = lesson.order || 0;
    if (!acc[order]) acc[order] = [];
    acc[order].push(lesson);
    return acc;
  }, {} as Record<number, Lesson[]>);
  
  // Sort orders
  const orders = Object.keys(lessonsByOrder).map(Number).sort((a, b) => a - b);

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-white dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm ${
        isDragging ? "opacity-50 ring-2 ring-primary" : ""
      }`}
    >
      {/* Module Header */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-zinc-900 border-b border-slate-200 dark:border-zinc-800">
        <button
          {...attributes}
          {...listeners}
          className="text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-grab active:cursor-grabbing p-1 rounded"
        >
          <GripHorizontal className="size-5" />
        </button>
        
        <button 
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          {isExpanded ? <ChevronDown className="size-5" /> : <ChevronRight className="size-5" />}
        </button>
        
        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="size-8 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
            <Folder className="size-4" />
          </div>
          <div className="min-w-0">
            <h3 className="font-bold text-slate-800 dark:text-white truncate text-base">
              {module.name}
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Chương {module.order} • {lessons.length} bài học
            </p>
          </div>
        </div>
      </div>
      
      {/* Module Content (Order Groups) */}
      {isExpanded && (
        <div className="p-4 space-y-6">
          <SortableContext items={orders.map(o => `order-group-${module.id}-${o}`)} strategy={verticalListSortingStrategy}>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-sm text-slate-500 dark:text-zinc-500 border-2 border-dashed border-slate-100 dark:border-zinc-800 rounded-xl">
                Module này chưa có bài học nào. Kéo thả bài học vào đây.
              </div>
            ) : (
              orders.map((order) => (
                <div key={`order-wrapper-${module.id}-${order}`} className="flex flex-col gap-3">
                  {isDraggingLesson && (
                    <InsertDropZone id={`insert-${module.id}-${order}`} order={order} moduleId={module.id} />
                  )}
                  <LessonOrderGroup
                    order={order}
                    moduleId={module.id}
                    lessons={lessonsByOrder[order]}
                    onEdit={onEditLesson}
                    onDelete={onDeleteLesson}
                  />
                </div>
              ))
            )}
          </SortableContext>
          
          {/* Dedicated drop zone for new order */}
          {orders.length > 0 && isDraggingLesson && (
            <div
              ref={setDropRef}
              className={`w-full mt-4 p-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 transition-colors ${
                isDropOver ? "border-primary bg-primary/10 text-primary" : "border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500"
              }`}
            >
              <Plus className="size-4" />
              <span className="text-sm font-medium">Thả bài học vào đây để tạo thứ tự mới</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
