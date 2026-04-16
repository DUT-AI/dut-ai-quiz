"use client";

import React, { useState, useEffect } from "react";
import { useQuestionStore } from "@/store/quiz-store";
import { useAuth } from "@/context/auth-context";
import { DashboardView } from "@/components/organisms/dashboard-view";

export default function Home() {
  const {
    fetchExams,
    examsRaw: exams,
    listLoading,
    listError,
    lessons,
    lessonsLoading,
    fetchLessons,
  } = useQuestionStore();

  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<"lessons" | "exams">("exams");

  useEffect(() => {
    if (isAuthenticated) {
      if (activeTab === "exams") fetchExams();
      if (activeTab === "lessons") fetchLessons();
    }
  }, [isAuthenticated, activeTab, fetchExams, fetchLessons]);

  // If not authenticated, the layout will handle showing the welcome page.
  if (!isAuthenticated) return null;

  return (
    <div className="w-full h-full">
      {/* Errors handling */}
      {listError && (
        <div className="space-y-2 mb-6">
          <div className="rounded-2xl bg-red-500/10 text-red-700 dark:text-red-300 p-4 text-sm font-bold border border-red-500/20">
            {listError}
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
        isLoadingExams={listLoading}
        isLoadingLessons={lessonsLoading}
      />
    </div>
  );
}
