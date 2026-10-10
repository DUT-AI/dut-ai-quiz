"use client";

import React, { createContext, useContext } from "react";
import type { Lesson } from "@/features/lessons/types";

export interface LessonContextValue {
  lesson: Lesson;
  lessonId: string;
  slug: string;
  isPreview: boolean;
}

const LessonContext = createContext<LessonContextValue | null>(null);

export function LessonProvider({
  value,
  children,
}: {
  value: LessonContextValue;
  children: React.ReactNode;
}) {
  return (
    <LessonContext.Provider value={value}>
      {children}
    </LessonContext.Provider>
  );
}

export function useLessonContext(): LessonContextValue {
  const context = useContext(LessonContext);
  if (!context) {
    throw new Error("useLessonContext must be used within a LessonProvider");
  }
  return context;
}
