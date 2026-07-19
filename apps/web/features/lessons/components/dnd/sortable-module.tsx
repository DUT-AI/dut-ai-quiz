"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripHorizontal, Folder, ChevronRight, Plus, Edit2, Trash2, HelpCircle } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
      className={`h-3.5 w-full -my-3.5 rounded-full transition-all z-10 relative ${isOver ? "bg-primary opacity-100 scale-y-125 shadow-md shadow-primary/30" : "bg-transparent opacity-0 hover:bg-primary/30"
        }`}
    />
  );
}

interface Props {
  module: Module;
  lessons: Lesson[];
  onEditModule: (module: Module) => void;
  onDeleteModule: (module: Module) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
}

export function SortableModule({ module, lessons, onEditModule, onDeleteModule, onEditLesson, onDeleteLesson }: Props) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showDescription, setShowDescription] = useState(false);


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
      className={`bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 rounded-2xl shadow-md shadow-slate-100/50 dark:shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:shadow-lg dark:hover:shadow-[0_12px_40px_rgba(0,0,0,0.6)] hover:border-indigo-500/30 dark:hover:border-indigo-500/50 border-l-4 border-l-indigo-500 transition-all duration-300 ${isDragging ? "opacity-50 ring-2 ring-primary border-primary" : ""
        }`}
    >
      {/* Module Header */}
      <div className="flex items-center gap-3 p-4 bg-gray-50/50 dark:bg-dark-blue/30 border-b border-gray-150 dark:border-white/10 group rounded-t-[15px]">
        <button
          {...attributes}
          {...listeners}
          className="text-gray-navy/40 hover:text-gray-navy dark:text-light-blue/50 dark:hover:text-light-blue cursor-grab active:cursor-grabbing p-1.5 hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 shrink-0"
          title="Kéo thả để sắp xếp Module"
        >
          <GripHorizontal className="size-5" />
        </button>

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="p-1.5 text-gray-navy/60 hover:text-gray-navy dark:text-light-blue/60 dark:hover:text-light-blue hover:bg-gray-100 dark:hover:bg-white/5 rounded-lg transition-colors duration-200 shrink-0"
        >
          <ChevronRight className={`size-5 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""}`} />
        </button>

        <div className="flex-1 flex items-center gap-3 min-w-0">
          <div className="size-9 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-650 dark:text-indigo-400 flex items-center justify-center shrink-0 border border-indigo-500/20 shadow-inner">
            <Folder className="size-4.5" />
          </div>
          <div
            className="min-w-0 relative group/desc"
            onMouseEnter={() => setShowDescription(true)}
            onMouseLeave={() => setShowDescription(false)}
          >
              <div className="flex items-center gap-1.5 cursor-help">
              <h3 className="font-extrabold text-dark-blue dark:text-white truncate text-base md:text-lg group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition-colors duration-200">
                {module.name}
              </h3>
              {module.description && (
                <HelpCircle className="size-4 text-gray-navy/60 dark:text-light-blue/50 shrink-0" />
              )}
            </div>
            <p className="text-xs text-gray-navy dark:text-light-blue/70 font-medium mt-0.5">
              Chương {module.order} • {lessons.length} bài học
            </p>

            {/* Floating Description Tooltip */}
            <AnimatePresence>
              {showDescription && module.description && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -12 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: -12 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="absolute bottom-full left-0 mb-3 w-96 p-4 bg-[#ffffff] dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl shadow-lg z-50 pointer-events-auto text-left"
                >
                  {/* Downward pointing speech bubble arrow */}
                  <div className="absolute -bottom-1.5 left-8 size-3 bg-[#ffffff] dark:bg-zinc-950 border-b border-r border-gray-200 dark:border-zinc-800 rotate-45 z-10" />

                  <div className="space-y-1.5 relative z-20">
                    <p className="text-[9px] font-black uppercase tracking-[0.18em] text-indigo-600 dark:text-indigo-400">
                      Mô tả chương
                    </p>
                    <div className="max-h-24 overflow-y-auto custom-scrollbar pr-1.5">
                      <p className="text-xs text-dark-blue dark:text-zinc-300 leading-relaxed font-semibold whitespace-pre-wrap break-words">
                        {module.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-1.5 ml-auto opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-300">
          <button
            onClick={() => onEditModule(module)}
            className="p-2 text-xs text-indigo-600 dark:text-indigo-455 hover:text-white hover:bg-indigo-500 dark:hover:text-navy-blue dark:hover:bg-indigo-400 rounded-lg border border-indigo-500/10 dark:border-indigo-400/20 transition-all duration-200 shadow-sm cursor-pointer"
            title="Sửa chương"
          >
            <Edit2 className="size-4" />
          </button>
          <button
            onClick={() => onDeleteModule(module)}
            className="p-2 text-xs text-rose-650 dark:text-rose-400 hover:text-white hover:bg-rose-550 dark:hover:text-white dark:hover:bg-rose-600 rounded-lg border border-rose-500/10 dark:border-rose-500/20 transition-all duration-200 shadow-sm cursor-pointer"
            title="Xóa chương"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Module Content (Order Groups) */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <div className="p-4 space-y-6">
              <SortableContext items={orders.map(o => `order-group-${module.id}-${o}`)} strategy={verticalListSortingStrategy}>
                {orders.length === 0 ? (
                  <div 
                    ref={setDropRef}
                    className={`text-center py-8 text-sm border-2 border-dashed rounded-2xl transition-all duration-300 ${
                      isDropOver
                        ? "border-primary bg-primary/10 text-primary shadow-inner scale-[1.01]"
                        : "text-gray-navy dark:text-light-blue border-gray-200 dark:border-white/5 bg-gray-50/20 dark:bg-navy-blue/10"
                    }`}
                  >
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
                  className={`w-full mt-4 p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-2 transition-all duration-300 ${isDropOver
                    ? "border-primary bg-primary/10 text-primary shadow-inner"
                    : "border-gray-200 dark:border-white/10 text-gray-navy/70 dark:text-light-blue/70 hover:border-gray-300 dark:hover:border-white/20"
                    }`}
                >
                  <Plus className="size-4" />
                  <span className="text-sm font-semibold">Thả bài học vào đây để tạo thứ tự mới</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
