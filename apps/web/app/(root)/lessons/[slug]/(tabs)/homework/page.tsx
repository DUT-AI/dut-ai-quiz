"use client";

import React from "react";
import { motion } from "framer-motion";
import { HomeworkTab } from "@/features/homeworks/components/homework-tab";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonHomeworkPage() {
  const { lessonId, slug, isPreview } = useLessonContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <HomeworkTab lessonId={lessonId} slug={slug} isPreview={isPreview} />
    </motion.div>
  );
}
