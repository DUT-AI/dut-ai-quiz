"use client";

import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameActiveSessionLoaderV2 from "@/features/game/components/game-active-session-loader-v2";

function GameV2Content() {
  const searchParams = useSearchParams();
  const slug = searchParams.get("slug") || "bai-tap-1";

  return <GameActiveSessionLoaderV2 lessonSlug={slug} />;
}

export default function DirectGameV2Page() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#f4eedb] dark:bg-[#09090b]">
          <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full" />
        </div>
      }
    >
      <GameV2Content />
    </Suspense>
  );
}
