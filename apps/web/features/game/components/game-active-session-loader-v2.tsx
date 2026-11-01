"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useActiveGameSession, useStartGameSession } from "../queries";
import GameContainerV2 from "./game-container-v2";
import { toast } from "sonner";

interface GameActiveSessionLoaderV2Props {
  lessonSlug: string;
}

export default function GameActiveSessionLoaderV2({ lessonSlug }: GameActiveSessionLoaderV2Props) {
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

      startSessionMutation.mutate(
        { lesson_slug: lessonSlug },
        {
          onSuccess: (data) => {
            setResolvedSession(data);
            setIsLoaded(true);
          },
          onError: (err: any) => {
            console.error("[LoaderV2] Error starting session:", err);
            toast.error(err.message || "Không thể khởi tạo đấu trường V2!");
            router.push(`/lessons/${lessonSlug}`);
          },
        }
      );
    };

    if (!isLoading) {
      if (activeSession) {
        setResolvedSession(activeSession);
        setIsLoaded(true);
      } else {
        startNewSession();
      }
    }
  }, [isLoading, activeSession, lessonSlug, router, isLoaded, startSessionMutation]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#f4eedb] dark:bg-[#09090b] font-sans">
        <div className="size-12 border-4 border-indigo-500 border-t-transparent animate-spin rounded-full mb-6" />
        <p className="font-extrabold text-lg text-zinc-700 dark:text-zinc-400 font-mono animate-pulse">
          ĐANG KHỞI TẠO ĐẤU TRƯỜNG (V2)...
        </p>
      </div>
    );
  }

  return (
    <GameContainerV2
      key={resolvedSession?.id || "v2-session"}
      lessonSlug={lessonSlug}
      initialSession={resolvedSession}
    />
  );
}
