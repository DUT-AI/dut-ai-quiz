"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveGameSession, useStartGameSession } from "../queries";
import GameContainer from "./game-container";
import { toast } from "sonner";

interface GameActiveSessionLoaderProps {
  lessonSlug: string;
}

export default function GameActiveSessionLoader({ lessonSlug }: GameActiveSessionLoaderProps) {
  const router = useRouter();
  const hasCalledStartRef = useRef(false);

  const startSessionMutation = useStartGameSession();

  const { data: activeSession, isLoading } = useActiveGameSession(lessonSlug);

  const [resolvedSession, setResolvedSession] = useState<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (isLoaded) return;

    const startNewSession = () => {
      if (hasCalledStartRef.current) return;
      hasCalledStartRef.current = true;
      
      console.log("[LoaderDebug] Starting new session...");
      startSessionMutation.mutate(
        { lesson_slug: lessonSlug },
        {
          onSuccess: (data) => {
            console.log("[LoaderDebug] New session created successfully:", data);
            setResolvedSession(data);
            setIsLoaded(true);
          },
          onError: (err: any) => {
            console.error("[LoaderDebug] Error starting session:", err);
            toast.error(err.message || "Không thể khởi tạo đấu trường!");
            router.push(`/lessons/${lessonSlug}`);
          },
        }
      );
    };

    if (!isLoading) {
      if (activeSession) {
        console.log("[LoaderDebug] Found active session:", activeSession);
        setResolvedSession(activeSession);
        setIsLoaded(true);
      } else {
        console.log("[LoaderDebug] No active session found. Creating a new one...");
        startNewSession();
      }
    }
  }, [isLoading, activeSession, lessonSlug, router, isLoaded]);

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
