"use client";
import React, { useState, useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { BookOpen, Swords, ListRestart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

import { useLessons, useLessonBySlug } from "@/lib/queries";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import {
  TheoryTab,
  QuestionsTab,
  GameTab,
  LessonLoading,
  LessonNotFound,
  LessonDraft,
  LessonHeader,
} from "@/features/lessons/components";

export default function LessonSlugPage() {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  // Load all lessons list
  const { data: lessons = [], isLoading: isLoadingAll } = useLessons();

  // Find the matching lesson from list to get the id (especially in case slug parameter is UUID)
  const resolvedLesson = useMemo(() => {
    return (
      lessons.find((l) => l.slug === slug) ||
      lessons.find((l) => l.id === slug)
    );
  }, [lessons, slug]);

  // Fetch the full lesson detail by slug
  const { data: lesson, isLoading: isLoadingDetail } = useLessonBySlug(
    resolvedLesson?.slug || slug,
    { enabled: !!resolvedLesson?.slug }
  );

  const lessonId = resolvedLesson?.id || lesson?.id || "";

  const [activeTab, setActiveTab] = useState<"theory" | "questions" | "game">("theory");

  const isLoading = isLoadingAll || isLoadingDetail;

  const { user } = useAuth();

  useEffect(() => {
    let isUnloading = false;
    const handleBeforeUnload = () => {
      isUnloading = true;
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      if (!isUnloading && lessonId) {
        const storageKey = `practice_progress_${user?.id || "guest"}_${lessonId}`;
        try {
          sessionStorage.removeItem(storageKey);
          localStorage.removeItem(storageKey);
        } catch (e) {
          console.error("Failed to clear progress on navigate away", e);
        }
      }
    };
  }, [lessonId, user?.id]);

  if (isLoading) {
    return <LessonLoading />;
  }

  // Use resolved lesson info if detail query is not finished yet or returned None
  const currentLesson = lesson || resolvedLesson;

  if (!currentLesson) {
    return <LessonNotFound />;
  }

  return (
    <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
      <LessonHeader lesson={currentLesson} backUrl={isPreview ? "/teacher/lessons" : "/lessons"} />

      {/* Lesson specific tabs */}
      {!isPreview && (
        <div className="flex border-b border-gray-150 dark:border-white/10 gap-2 md:gap-4 overflow-x-auto no-scrollbar scroll-smooth">
          {(
            [
              { id: "theory", label: "Lý thuyết", icon: BookOpen },
              { id: "questions", label: "Luyện tập", icon: ListRestart },
              { id: "game", label: "Luyện tập thi đấu", icon: Swords },
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
                    ? "text-primary"
                    : "text-gray-navy dark:text-light-blue hover:text-primary opacity-70 hover:opacity-100"
                )}
              >
                <Icon className="size-4" />
                <span>{tab.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="lesson-active-tab-underline"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary"
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Panels */}
      <div className="w-full mt-8">
        {isPreview ? (
          <div>
            {!currentLesson.slug ? (
              <LessonDraft />
            ) : (
              <TheoryTab contentMd={currentLesson.content_md} lessonId={lessonId} />
            )}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {activeTab === "theory" && (
              <motion.div
                key="theory"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                {!currentLesson.slug ? (
                  <LessonDraft />
                ) : (
                  <TheoryTab contentMd={currentLesson.content_md} lessonId={lessonId} />
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

            {activeTab === "game" && (
              <motion.div
                key="game"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GameTab lessonId={lessonId} slug={currentLesson.slug || slug} />
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}

