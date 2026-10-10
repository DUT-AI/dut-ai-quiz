"use client";

import React from "react";
import { motion } from "framer-motion";
import { GameTab } from "@/features/lessons/components";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonArenaPage() {
  const { lesson, lessonId, slug } = useLessonContext();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
    >
      <GameTab lessonId={lessonId} slug={lesson.slug || slug} />
    </motion.div>
  );
}
