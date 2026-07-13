"use client";

import { useParams } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { QuestionsTab } from "@/features/lessons/components";

export default function LessonQuestionsPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const { data: lessons } = useLessons();
  const lesson = lessons?.find((l) => l.id === lessonId);

  return (
    <div className="w-full py-2 animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Questions Tab Section */}
      <QuestionsTab
        lessonId={lessonId}
        isAdminView={true}
        lessonName={lesson?.name}
      />
    </div>
  );
}

