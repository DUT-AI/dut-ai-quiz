"use client";

import React, { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { DashboardView } from "@/components/organisms/dashboard-view";
import { useExamsFull, useLessons } from "@/lib/queries";

export default function DashboardPage() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"lessons" | "exams">("exams");

  const {
    data: exams = [],
    isLoading: isExamsLoading,
    error: examsError,
  } = useExamsFull({ enabled: isAuthenticated && !isLoading });

  const {
    data: lessons = [],
    isLoading: isLessonsLoading,
    error: lessonsError,
  } = useLessons({ enabled: isAuthenticated && !isLoading });

  const errorMsg =
    (examsError instanceof Error ? examsError.message : "") ||
    (lessonsError instanceof Error ? lessonsError.message : "");

  return (
    <div className="w-full h-full">
      {/* Errors handling */}
      {errorMsg && (
        <div className="space-y-2 mb-6">
          <div className="rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300 p-4 text-sm font-bold border border-red-500/20">
            {errorMsg}
          </div>
        </div>
      )}

      {/* Main Content: Dashboard Overview */}
      <DashboardView
        user={user}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        exams={exams}
        lessons={lessons}
        isLoadingExams={isExamsLoading}
        isLoadingLessons={isLessonsLoading}
      />
    </div>
  );
}
