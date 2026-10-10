"use client";

import React from "react";
import { motion } from "framer-motion";
import { QuestionsTab } from "@/features/lessons/components";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonPracticePage() {
  const { lessonId } = useLessonContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <QuestionsTab lessonId={lessonId} />
    </motion.div>
  );
}
