"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { QuestionEditorModal } from "@/features/questions/components/question-editor-modal";

export default function NewQuestionPage() {
  const { id: lessonId } = useParams<{ id: string }>();
  const router = useRouter();

  if (!lessonId) return null;

  const handleBack = () => {
    router.push(`/teacher/lessons/${lessonId}/questions`);
  };

  return (
    <QuestionEditorModal
      lessonId={lessonId}
      onClose={handleBack}
      onSuccess={handleBack}
    />
  );
}
