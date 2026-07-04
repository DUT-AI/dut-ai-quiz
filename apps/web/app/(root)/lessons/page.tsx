"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { useLessons } from "@/lib/queries";
import { AnimatePresence } from "framer-motion";
import { LessonCard } from "@/features/lessons/components";

export default function LessonsContentPage() {
  const router = useRouter();
  const { data: lessons = [], isLoading: isLoadingLessons } = useLessons();

  return (
    <div className="w-full space-y-8">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="text-4xl md:text-5xl font-bold text-dark-blue dark:text-white">
          Học tập & <span className="text-primary">Khám phá</span>
        </h1>
        <p className="text-gray-navy dark:text-light-blue mt-2">
          Hệ thống lộ trình bài học giúp bạn nắm vững kiến thức từ cơ bản đến nâng cao.
        </p>
      </div>

      <div className="w-full">
        {isLoadingLessons ? (
          <div className="flex flex-col items-center py-20 opacity-30">
            <div className="size-10 border-4 border-primary border-t-transparent animate-spin rounded-full mb-4" />
            <p className="font-bold">Đang tải giáo trình...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            <AnimatePresence>
              {lessons.map((lesson, index) => (
                <LessonCard
                  key={lesson.id}
                  lesson={lesson}
                  index={index}
                  onClick={() => router.push(`/lessons/${lesson.slug || lesson.id}`)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

