"use client";

import React from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { LessonVideoTab } from "@/features/lessons/components/video/lesson-video-tab";
import { useLessonContext } from "@/features/lessons/context/lesson-context";

export default function LessonVideoPage() {
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
      <LessonVideoTab lesson={lesson} slug={slug || ""} />
    </motion.div>
  );
}
