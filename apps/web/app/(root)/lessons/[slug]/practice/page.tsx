"use client";

import React from "react";
import { useParams } from "next/navigation";
import PracticeGameContainer from "@/features/game/components/practice-game-container";

export default function PracticeGamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  return <PracticeGameContainer lessonSlug={slug} />;
}
