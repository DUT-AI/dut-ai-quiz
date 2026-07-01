"use client";

import React, { useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { BookOpen, ArrowLeft, Sparkles, Swords, ListRestart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useLessons, useLessonBySlug } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { TheoryTab, QuestionsTab, PracticeTab } from "@/features/lessons/components";

export default function LessonSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  // Load all lessons list
  const { data: lessons = [], isLoading: isLoadingAll } = useLessons();

  // Find the matching lesson from list to get the id (especially in case slug parameter is UUID)
  const resolvedLesson = useMemo(() => {
    return (
      lessons.find((l) => l.slug === slug) ||
      lessons.find((l) => l.id === slug)
    );
  }, [lessons, slug]);

  const lessonId = resolvedLesson?.id || "";

  // Fetch the full lesson detail by slug
  const { data: lesson, isLoading: isLoadingDetail } = useLessonBySlug(
    resolvedLesson?.slug || slug,
    { enabled: !!resolvedLesson?.slug }
  );

  const [activeTab, setActiveTab] = useState<"theory" | "questions" | "practice">("theory");

  const isLoading = isLoadingAll || isLoadingDetail;

  if (isLoading) {
    return (
      <div className="h-full flex flex-col items-center justify-center py-40 opacity-50">
        <div className="size-12 border-4 border-primary border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-bold text-lg">Đang tải bài học...</p>
      </div>
    );
  }

  // Use resolved lesson info if detail query is not finished yet or returned None
  const currentLesson = lesson || resolvedLesson;

  if (!currentLesson) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center py-40">
        <h2 className="text-3xl font-black text-dark-blue dark:text-white mb-6">Không tìm thấy bài học</h2>
        <Button onClick={() => router.push("/lessons")} className="rounded-2xl">
          Quay lại danh sách bài học
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      {/* Back button */}
      <button
        onClick={() => router.push("/lessons")}
        className="flex items-center gap-2 text-primary font-bold hover:gap-3 transition-all mb-4 group"
      >
        <ArrowLeft className="size-5" />
        Quay lại danh sách bài học
      </button>

      {/* Lesson Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 mb-8">
        <div>
          <span className="text-xs font-black text-primary uppercase tracking-[0.3em] mb-2 block">
            BÀI HỌC {currentLesson.order}
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-dark-blue dark:text-white mb-4">
            {currentLesson.name}
          </h1>
          <p className="text-lg text-gray-navy dark:text-light-blue max-w-3xl opacity-75 leading-relaxed font-medium">
            {currentLesson.description || "Tìm hiểu sâu kiến thức lý thuyết và làm bài tập thực hành."}
          </p>
        </div>
      </div>

      {/* Lesson specific tabs */}
      <div className="flex border-b border-gray-150 dark:border-white/10 gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
        {(
          [
            { id: "theory", label: "Lý thuyết", icon: BookOpen },
            { id: "questions", label: "Trắc nghiệm câu hỏi", icon: ListRestart },
            { id: "practice", label: "Luyện tập thi đấu", icon: Swords },
          ] as const
        ).map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "relative flex items-center gap-2 px-6 py-4 text-sm font-black transition-all duration-200 text-nowrap rounded-t-2xl pb-4 border-b-2 border-transparent",
                isActive
                  ? "text-primary border-primary"
                  : "text-gray-navy dark:text-light-blue hover:text-primary opacity-70 hover:opacity-100"
              )}
            >
              <Icon className="size-4" />
              <span>{tab.label}</span>
              {isActive && (
                <motion.div
                  layoutId="lesson-active-tab-underline"
                  className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="w-full mt-8">
        <AnimatePresence mode="wait">
          {activeTab === "theory" && (
            <motion.div
              key="theory"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {!currentLesson.slug ? (
                <div className="flex flex-col items-center justify-center text-center py-20 bg-white dark:bg-navy-blue/40 border border-gray-150 dark:border-white/5 rounded-[2.5rem] shadow-xl p-8 max-w-2xl mx-auto">
                  <div className="size-16 rounded-3xl bg-amber-500/10 flex items-center justify-center text-amber-500 mb-6 animate-pulse">
                    <Sparkles className="size-8" />
                  </div>
                  <h3 className="text-2xl font-black text-dark-blue dark:text-white mb-3">
                    Bài học đang soạn thảo
                  </h3>
                  <p className="text-gray-navy dark:text-light-blue opacity-70 max-w-md text-sm leading-relaxed">
                    Nội dung lý thuyết của bài học này đang được tiến hành soạn thảo và cập nhật. Vui lòng quay lại sau!
                  </p>
                </div>
              ) : (
                <TheoryTab contentMd={currentLesson.content_md} />
              )}
            </motion.div>
          )}

          {activeTab === "questions" && (
            <motion.div
              key="questions"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <QuestionsTab lessonId={lessonId} />
            </motion.div>
          )}

          {activeTab === "practice" && (
            <motion.div
              key="practice"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <PracticeTab lessonId={lessonId} slug={currentLesson.slug || slug} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
