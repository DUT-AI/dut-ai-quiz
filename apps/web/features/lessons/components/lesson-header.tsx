import React from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Lesson } from "../types";
import { LessonNavBar } from "./lesson-nav-bar";

interface LessonHeaderProps {
  lesson: Partial<Lesson>;
  backUrl?: string;
}

export function LessonHeader({ lesson, backUrl = "/lessons" }: LessonHeaderProps) {
  return (
    <>
      {/* Top Action Row: Back button & Lesson Navigation Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-40">
        <Link
          href={backUrl}
          className="inline-flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all group shrink-0"
        >
          <ArrowLeft className="size-5" />
          Quay lại danh sách bài học
        </Link>

        {/* 3 Lesson Navigation Buttons (Prev - Dropdown - Next) */}
        <div className="flex items-center justify-start sm:justify-end relative z-40">
          <LessonNavBar currentLesson={lesson} />
        </div>
      </div>

      {/* Lesson Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">
            BÀI HỌC {lesson.order}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white mb-4">
            {lesson.name}
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-3xl opacity-75 leading-relaxed font-medium">
            {lesson.description || "Tìm hiểu sâu kiến thức lý thuyết và làm bài tập thực hành."}
          </p>
        </div>
      </div>
    </>
  );
}
