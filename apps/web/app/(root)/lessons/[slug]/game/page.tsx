"use client";

import React, { Suspense } from "react";
import { useParams } from "next/navigation";
import GameActiveSessionLoader from "@/features/game/components/game-active-session-loader";

export default function GamePage() {
  const { slug } = useParams<{ slug: string }>();

  if (!slug) return null;

  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#f4eedb] dark:bg-[#09090b]">
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full" />
      </div>
    }>
      <GameActiveSessionLoader lessonSlug={slug} />
    </Suspense>
  );
}
