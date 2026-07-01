"use client";

import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useLessons } from "@/lib/queries";
import { QuestionsTab } from "@/features/lessons/components";

export default function LessonQuestionsPage() {
  const router = useRouter();
  const { id: lessonId } = useParams<{ id: string }>();
  const { data: lessons } = useLessons();
  const lesson = lessons?.find((l) => l.id === lessonId);

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 mb-6 text-sm">
        <Link href="/teacher/lessons" className="text-gray-navy dark:text-light-blue hover:underline">
          Bài học
        </Link>
        <span className="text-gray-navy dark:text-light-blue">/</span>
        <span className="font-semibold text-dark-blue dark:text-white">
          {lesson?.name ?? "…"}
        </span>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push("/teacher/lessons")}
        className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all mb-4 group"
      >
        <ArrowLeft className="size-5" />
        Quay lại quản lý bài học
      </button>

      {/* Questions Tab Section */}
      <div className="bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/5 rounded-[2.5rem] p-6 md:p-8 shadow-xl">
        <QuestionsTab lessonId={lessonId} />
      </div>
    </div>
  );
}
