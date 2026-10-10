"use client";

import React, { useMemo, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useLessons, useLessonBySlug } from "@/lib/queries";
import { useAuth } from "@/context/auth-context";
import {
  LessonLoading,
  LessonNotFound,
  LessonHeader,
  LessonTabsBar,
} from "@/features/lessons/components";
import { LessonComments } from "@/features/comments/components/lesson-comments";
import { LessonProvider } from "@/features/lessons/context/lesson-context";
import { useLearningPathStore } from "@/store/learning-path-store";

export default function LessonTabsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { slug } = useParams<{ slug: string }>();
  const searchParams = useSearchParams();
  const isPreview = searchParams.get("preview") === "true";

  // Load all lessons list to resolve ID/slug
  const { data: lessons = [], isLoading: isLoadingAll } = useLessons();

  const resolvedLesson = useMemo(() => {
    return (
      lessons.find((l) => l.slug === slug) ||
      lessons.find((l) => l.id === slug)
    );
  }, [lessons, slug]);

  const { data: lesson, isLoading: isLoadingDetail } = useLessonBySlug(
    resolvedLesson?.slug || slug,
    { enabled: !!resolvedLesson?.slug }
  );

  const lessonId = resolvedLesson?.id || lesson?.id || "";
  const { user } = useAuth();
  const isLoading = isLoadingAll || isLoadingDetail;

  // Clear practice progress ONLY when leaving the lesson (unmounting layout) or window unload
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

  const setLastVisitedLesson = useLearningPathStore((s) => s.setLastVisitedLesson);
  const currentLesson = lesson || resolvedLesson;

  useEffect(() => {
    if (currentLesson) {
      setLastVisitedLesson({
        id: currentLesson.id,
        slug: currentLesson.slug,
        moduleId: currentLesson.module_id,
      });
    }
  }, [currentLesson, setLastVisitedLesson]);

  if (isLoading) {
    return <LessonLoading />;
  }

  if (!currentLesson) {
    return <LessonNotFound />;
  }

  return (
    <LessonProvider
      value={{
        lesson: currentLesson,
        lessonId,
        slug: currentLesson.slug || slug,
        isPreview,
      }}
    >
      <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20 text-left">
        <LessonHeader
          lesson={currentLesson}
          backUrl={isPreview ? "/teacher/lessons" : "/lessons"}
        />

        {!isPreview && (
          <LessonTabsBar slug={currentLesson.slug || slug} isPreview={isPreview} />
        )}

        <div className="w-full mt-8">
          {children}
        </div>

        {lessonId && (
          <div className="mt-12 pt-8 border-t border-gray-150 dark:border-white/10">
            <LessonComments lessonId={lessonId} />
          </div>
        )}
      </div>
    </LessonProvider>
  );
}
