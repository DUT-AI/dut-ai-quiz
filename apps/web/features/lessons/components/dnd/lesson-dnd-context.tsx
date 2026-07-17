"use client";

import { useState } from "react";
import { DndContext, DragOverlay, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragStartEvent, DragEndEvent, DragOverEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, arrayMove } from "@dnd-kit/sortable";
import { SortableModule } from "./sortable-module";
import { SortableLesson } from "./sortable-lesson";
import { UnassignedLessons } from "./unassigned-lessons";
import type { Module, Lesson } from "@/features/lessons/types";

interface Props {
  modules: Module[];
  lessons: Lesson[];
  onModulesReorder: (moduleIds: string[]) => void;
  onLessonsReorder: (lessons: { id: string; order: number; module_id: string | null }[]) => void;
  onEditLesson: (lesson: Lesson) => void;
  onDeleteLesson: (lesson: Lesson) => void;
}

export function LessonDndContext({ 
  modules: initialModules, 
  lessons: initialLessons,
  onModulesReorder,
  onLessonsReorder,
  onEditLesson,
  onDeleteLesson
}: Props) {
  const [modules, setModules] = useState(initialModules);
  const [lessons, setLessons] = useState(initialLessons);
  
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [activeOrderGroup, setActiveOrderGroup] = useState<any | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const type = active.data.current?.type;
    if (type === "Module") {
      setActiveModule(active.data.current?.module);
    } else if (type === "Lesson") {
      setActiveLesson(active.data.current?.lesson);
    } else if (type === "OrderGroup") {
      setActiveOrderGroup(active.data.current);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    // Handling intermediate visual moves could go here
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveModule(null);
    setActiveLesson(null);
    setActiveOrderGroup(null);

    const { active, over } = event;
    if (!over) return;

    const activeType = active.data.current?.type;
    
    // Module Reordering
    if (activeType === "Module" && over.data.current?.type === "Module") {
      if (active.id !== over.id) {
        const oldIndex = modules.findIndex((m) => `module-${m.id}` === active.id);
        const newIndex = modules.findIndex((m) => `module-${m.id}` === over.id);
        const newModules = arrayMove(modules, oldIndex, newIndex);
        setModules(newModules);
        onModulesReorder(newModules.map(m => m.id));
      }
      return;
    }

    // OrderGroup Reordering
    if (activeType === "OrderGroup" && over.data.current?.type === "OrderGroup") {
      const activeOrder = active.data.current?.order;
      const overOrder = over.data.current?.order;
      const moduleId = active.data.current?.moduleId;

      if (activeOrder !== overOrder && moduleId === over.data.current?.moduleId) {
        // Swap orders for all lessons in these two groups
        const updatedLessons = lessons.map(l => {
          if (l.module_id === moduleId) {
            if (l.order === activeOrder) return { ...l, order: overOrder };
            if (l.order === overOrder) return { ...l, order: activeOrder };
          }
          return l;
        });
        setLessons(updatedLessons);

        // Notify backend of changes
        const changedLessons = updatedLessons.filter(l => l.module_id === moduleId && (l.order === activeOrder || l.order === overOrder));
        onLessonsReorder(changedLessons.map(l => ({ id: l.id, order: l.order as number, module_id: l.module_id ?? null })));
      }
      return;
    }

    // Lesson Reordering
    if (activeType === "Lesson") {
      const draggedLesson = lessons.find(l => `lesson-${l.id}` === active.id);
      if (!draggedLesson) return;

      const overType = over.data.current?.type;
      
      let newLessons = [...lessons];
      let hasChanges = false;
      let targetOrder = draggedLesson.order;
      let targetModuleId = draggedLesson.module_id;

      if (overType === "Lesson") {
        // Dropped onto another lesson
        const targetLesson = over.data.current?.lesson as Lesson;
        targetOrder = targetLesson.order;
        targetModuleId = targetLesson.module_id;
        hasChanges = targetOrder !== draggedLesson.order || targetModuleId !== draggedLesson.module_id;
        
      } else if (overType === "OrderGroup") {
        // Dropped onto an order group (row)
        targetOrder = over.data.current?.order;
        targetModuleId = over.data.current?.moduleId;
        hasChanges = targetOrder !== draggedLesson.order || targetModuleId !== draggedLesson.module_id;

      } else if (overType === "UnassignedArea") {
        // Dropped into unassigned
        targetModuleId = null;
        // Find max order in unassigned to append
        const unassignedLessons = lessons.filter(l => !l.module_id);
        targetOrder = unassignedLessons.length > 0 ? Math.max(...unassignedLessons.map(l => l.order)) + 1 : 1;
        hasChanges = targetModuleId !== draggedLesson.module_id || targetOrder !== draggedLesson.order;
      } else if (overType === "Module") {
        // Dropped directly onto a Module header or empty space
        targetModuleId = over.data.current?.module?.id;
        const moduleLessons = lessons.filter(l => l.module_id === targetModuleId);
        targetOrder = moduleLessons.length > 0 ? Math.max(...moduleLessons.map(l => l.order)) + 1 : 1;
        hasChanges = targetModuleId !== draggedLesson.module_id || targetOrder !== draggedLesson.order;
      } else if (overType === "InsertZone") {
        // Dropped between two OrderGroups
        targetModuleId = over.data.current?.moduleId;
        const insertOrder = over.data.current?.order;
        targetOrder = insertOrder - 0.5; // Temporary fractional order to place it before the target
        hasChanges = true;
      }

      if (hasChanges) {
        // 1. Update the dragged lesson
        const updatedLesson = { ...draggedLesson, order: targetOrder, module_id: targetModuleId };
        let newLessonsList = lessons.map(l => l.id === draggedLesson.id ? updatedLesson : { ...l }); // Deep enough copy

        // 2. Normalize orders in the target module so they are sequential integers (1, 2, 3...)
        const targetModuleLessons = newLessonsList.filter(l => l.module_id === targetModuleId).sort((a, b) => a.order - b.order);
        
        let currentNormalizedOrder = 1;
        let lastSeenRawOrder = -999;
        const changedForBackend: { id: string; order: number; module_id: string | null }[] = [];

        for (let i = 0; i < targetModuleLessons.length; i++) {
          const l = targetModuleLessons[i];
          if (l.order !== lastSeenRawOrder) {
            if (lastSeenRawOrder !== -999) currentNormalizedOrder++;
            lastSeenRawOrder = l.order;
          }
          
          const oldOrder = lessons.find(oldL => oldL.id === l.id)?.order;
          const oldModuleId = lessons.find(oldL => oldL.id === l.id)?.module_id;
          
          l.order = currentNormalizedOrder;
          
          // If this lesson changed order or module, we add it to the payload
          if (oldOrder !== l.order || oldModuleId !== l.module_id) {
            changedForBackend.push({ id: l.id, order: l.order as number, module_id: l.module_id ?? null });
          }
        }

        setLessons(newLessonsList);
        
        if (changedForBackend.length > 0) {
          onLessonsReorder(changedForBackend);
        }
      }
    }
  };

  const assignedLessons = lessons.filter(l => l.module_id);
  const unassignedLessons = lessons.filter(l => !l.module_id).sort((a, b) => a.order - b.order);

  return (
    <DndContext 
      sensors={sensors} 
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="w-full flex flex-col gap-8">
        <SortableContext items={modules.map(m => `module-${m.id}`)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-4">
            {modules.map(module => (
              <SortableModule 
                key={module.id} 
                module={module} 
                lessons={assignedLessons.filter(l => l.module_id === module.id)} 
                onEditLesson={onEditLesson}
                onDeleteLesson={onDeleteLesson}
              />
            ))}
          </div>
        </SortableContext>
        
        <UnassignedLessons 
          lessons={unassignedLessons} 
          onEditLesson={onEditLesson}
          onDeleteLesson={onDeleteLesson}
        />
      </div>

      <DragOverlay>
        {activeModule ? (
          <div className="opacity-80 scale-105 pointer-events-none">
            <SortableModule 
              module={activeModule} 
              lessons={[]} 
              onEditLesson={() => {}} 
              onDeleteLesson={() => {}} 
            />
          </div>
        ) : null}
        {activeLesson ? (
          <div className="opacity-80 scale-105 pointer-events-none">
            <SortableLesson 
              lesson={activeLesson} 
              onEdit={() => {}} 
              onDelete={() => {}} 
            />
          </div>
        ) : null}
        {activeOrderGroup ? (
          <div className="opacity-80 scale-105 pointer-events-none p-4 bg-slate-50 dark:bg-zinc-900 border-2 border-primary border-dashed rounded-xl flex items-center justify-center">
            <span className="font-bold text-primary">Đang di chuyển nhóm bài học...</span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
