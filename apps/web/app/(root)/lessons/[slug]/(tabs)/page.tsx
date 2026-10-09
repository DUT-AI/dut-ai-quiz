"use client";

import React from "react";
import { motion } from "framer-motion";
import { TheoryTab, LessonDraft } from "@/features/lessons/components";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonTheoryPage() {
  const { lesson, lessonId } = useLessonContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      {!lesson.content_md ? (
        <LessonDraft />
      ) : (
        <TheoryTab contentMd={lesson.content_md} lessonId={lessonId} />
      )}
    </motion.div>
  );
}
