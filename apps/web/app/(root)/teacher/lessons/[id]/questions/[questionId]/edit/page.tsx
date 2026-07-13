"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuestion } from "@/features/questions/queries";
import { QuestionEditorModal } from "@/features/questions/components/question-editor-modal";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EditQuestionPage() {
  const { id: lessonId, questionId } = useParams<{ id: string; questionId: string }>();
  const router = useRouter();

  const { data: question, isLoading } = useQuestion(questionId ?? "");

  if (!lessonId || !questionId) return null;

  const handleBack = () => {
    router.push(`/teacher/lessons/${lessonId}/questions`);
  };

  if (isLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white dark:bg-navy-blue">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="size-8 animate-spin text-primary" />
          <p className="text-sm text-gray-navy animate-pulse">Đang tải câu hỏi...</p>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-white dark:bg-navy-blue p-6 text-center">
        <h2 className="text-xl font-bold text-dark-blue dark:text-white">Không tìm thấy câu hỏi</h2>
        <Button onClick={handleBack}>
          Quay lại bài học
        </Button>
      </div>
    );
  }

  return (
    <QuestionEditorModal
      lessonId={lessonId}
      initialData={question}
      onClose={handleBack}
      onSuccess={handleBack}
    />
  );
}
