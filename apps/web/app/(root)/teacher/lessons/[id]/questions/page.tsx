"use client";

import { useParams } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { QuestionsTab } from "@/features/lessons/components";

export default function LessonQuestionsPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const { data: lessons } = useLessons();
  const lesson = lessons?.find((l) => l.id === lessonId);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* Questions Tab Section */}
      <QuestionsTab
        lessonId={lessonId}
        isAdminView={true}
        lessonName={lesson?.name}
      />
    </div>
  );
}

