"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { LessonEssayTab } from "@/features/lessons/components/essay/lesson-essay-tab";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonEssayPage() {
  const { lesson } = useLessonContext();
  const { slug } = useParams<{ slug: string }>();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="w-full"
    >
      <LessonEssayTab lesson={lesson} slug={slug || ""} />
    </motion.div>
  );
}
