"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Lesson } from "@/features/lessons/types";
import { LessonCard } from "./lesson-card";

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
    <div ref={setNodeRef} style={style}>
      <LessonCard
        lesson={lesson}
        onEdit={onEdit}
        onDelete={onDelete}
        dragHandleProps={{ ...attributes, ...listeners }}
        isDragging={isDragging}
      />
    </div>
  );
}

