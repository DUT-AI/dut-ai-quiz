"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useActiveGameSession } from "../queries";
import GameContainer from "./game-container";

interface GameActiveSessionLoaderProps {
  lessonSlug: string;
}

export default function GameActiveSessionLoader({ lessonSlug }: GameActiveSessionLoaderProps) {
  const searchParams = useSearchParams();
  const action = searchParams?.get("action");

  const { data: activeSession, isLoading, error } = useActiveGameSession(lessonSlug, {
    enabled: !!lessonSlug && action !== "new",
  });

  const [resolvedSession, setResolvedSession] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setResolvedSession(activeSession || null);
      setIsLoaded(true);
    }
  }, [isLoading, activeSession]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4eedb] dark:bg-[#09090b] font-sans">
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-400 font-mono animate-pulse">
          ĐANG KHỞI TẠO ĐẤU TRƯỜNG...
        </p>
      </div>
    );
  }

  return <GameContainer lessonSlug={lessonSlug} initialSession={resolvedSession} />;
}
