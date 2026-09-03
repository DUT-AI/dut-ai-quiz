import { Suspense } from "react";
import { LessonEditorPage } from "@/features/lessons/components/lesson-editor-page";

export default function NewLessonPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-[60vh] bg-white dark:bg-navy-blue">
        <div className="size-8 border-2 border-primary border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <LessonEditorPage />
    </Suspense>
  );
}
