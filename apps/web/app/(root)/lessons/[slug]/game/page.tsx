"use client";

import React from "react";
import { useParams } from "next/navigation";
import GameContainer from "@/features/game/components/game-container";

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  return <GameContainer lessonSlug={slug} />;
}
