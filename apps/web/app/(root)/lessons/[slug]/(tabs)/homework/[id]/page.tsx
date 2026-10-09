"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { StudentHomeworkDetail } from "@/features/homeworks/components/student-homework-detail";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function StudentHomeworkDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { lessonId, slug, isPreview } = useLessonContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <StudentHomeworkDetail
        homeworkId={id}
        lessonId={lessonId}
        slug={slug}
        isPreview={isPreview}
      />
    </motion.div>
  );
}
