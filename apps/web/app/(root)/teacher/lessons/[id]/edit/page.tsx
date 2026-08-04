"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { LessonEditorPage } from "@/features/lessons/components/lesson-editor-page";

export default function EditLessonPage() {
  const { id } = useParams<{ id: string }>();
  const { data: lessons = [] } = useLessons();

  const lesson = lessons.find((l) => l.id === id);

  if (!lesson) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="size-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    );
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] bg-white dark:bg-navy-blue">
        <div className="size-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <LessonEditorPage initialData={lesson} lessonId={id} />
    </Suspense>
  );
}
