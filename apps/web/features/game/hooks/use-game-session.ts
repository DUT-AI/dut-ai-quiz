"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useStartGameSession } from "../queries";
import {
  type GameQuestion,
  type GamificationState,
  type ScreenState,
  type GameResultState,
  type StageProgressStatus,
} from "../types";

export interface UseGameSessionProps {
  lessonSlug: string;
  initialSession: any; // StartGameSessionResponse | null
}

export function useGameSession({ lessonSlug, initialSession }: UseGameSessionProps) {
  const router = useRouter();
  const hasInitializedRef = useRef(false);

  const startSessionMutation = useStartGameSession();

  // Core session states
  const [screen, setScreen] = useState<ScreenState>("start");
  const [sessionId, setSessionId] = useState<string>("");
  const [questions, setQuestions] = useState<GameQuestion[]>([]);
  const [gamification, setGamification] = useState<GamificationState | null>(null);

  // Gameplay progress states
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hp, setHp] = useState(3);
  const [gold, setGold] = useState(0);
  const [score, setScore] = useState(0);
  const [gameResult, setGameResult] = useState<GameResultState>("playing");
  const [stageProgress, setStageProgress] = useState<StageProgressStatus[]>([]);

  // Boss states
  const [bossHp, setBossHp] = useState(5);
  const [bossMaxHp, setBossMaxHp] = useState(5);
  const [showBossWarning, setShowBossWarning] = useState(false);
  const [isBossMode, setIsBossMode] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);

  const currentQuestion = questions[currentIdx] || null;
  const stage = currentQuestion?.tier || 1;

  // Initialize game state from snapshot data
  const initializeGame = useCallback(
    (sessionData: { session_id: string; snapshot: any }) => {
      try {
        const snap = sessionData?.snapshot;
        if (!snap) {
          throw new Error("Dữ liệu snapshot không hợp lệ (null/undefined)!");
        }

        setSessionId(sessionData.session_id);
        setQuestions(snap.questions || []);
        setGamification(snap.gamification);

        const gamificationState = snap.gamification || {};
        const idx = gamificationState.last_question_index || 0;
        setCurrentIdx(idx);

        if (idx === 0) {
          setCountdown(3);
        } else {
          setCountdown(null);
        }

        setHp(gamificationState.lives ?? 3);
        setGold(gamificationState.gold ?? 0);
        setScore(gamificationState.points ?? 0);

        // Reconstruct progress dots based on answers
        const totalQCount = (snap.questions || []).length;
        const progress: StageProgressStatus[] = Array.from({ length: totalQCount }).map(() => "idle");
        for (let i = 0; i < idx; i++) {
          progress[i] = "correct";
        }
        setStageProgress(progress);

        // Check if current question is a boss fight
        const currentQ = (snap.questions || [])[idx];
        if (currentQ) {
          const bossMode = currentQ.is_boss;
          setIsBossMode(bossMode);
          setBossHp(gamificationState.boss_hp === 1 ? 5 : 0);
          setBossMaxHp(5);
        }

        setGameResult("playing");
        setScreen("playing");
      } catch (err: any) {
        console.error("[useGameSession] initializeGame error:", err);
        toast.error(`Lỗi khởi tạo game: ${err.message || err}`);
        router.push(`/lessons/${lessonSlug}`);
      }
    },
    [lessonSlug, router]
  );

  // Auto-initialize session on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;

    if (initialSession) {
      hasInitializedRef.current = true;
      initializeGame(initialSession);
    } else {
      hasInitializedRef.current = true;
      startSessionMutation.mutate(
        { lesson_slug: lessonSlug },
        {
          onSuccess: (data) => {
            initializeGame(data);
          },
          onError: (err: any) => {
            console.error("[useGameSession] startSessionMutation error:", err);
            toast.error(err.message || "Không thể khởi tạo đấu trường!");
            router.push(`/lessons/${lessonSlug}`);
          },
        }
      );
    }
  }, [initialSession, lessonSlug, initializeGame, startSessionMutation, router]);

  // Handle Match Replay / Retry
  const handleRetry = useCallback(() => {
    startSessionMutation.mutate(
      { lesson_slug: lessonSlug },
      {
        onSuccess: (data) => {
          initializeGame(data);
          toast.success("Trận đấu mới đã bắt đầu!");
        },
        onError: (err: any) => {
          toast.error(err.message || "Không thể bắt đầu trận đấu mới!");
        },
      }
    );
  }, [lessonSlug, initializeGame, startSessionMutation]);

  const isInitializing = startSessionMutation.isPending || !hasInitializedRef.current;

  return {
    // State
    sessionId,
    questions,
    gamification,
    screen,
    gameResult,
    currentIdx,
    currentQuestion,
    stage,
    hp,
    gold,
    score,
    stageProgress,
    bossHp,
    bossMaxHp,
    showBossWarning,
    isBossMode,
    countdown,
    isInitializing,

    // Updaters
    setScreen,
    setGameResult,
    setHp,
    setGold,
    setScore,
    setStageProgress,
    setCurrentIdx,
    setQuestions,
    setGamification,
    setBossHp,
    setBossMaxHp,
    setShowBossWarning,
    setIsBossMode,
    setCountdown,

    // Actions
    initializeGame,
    handleRetry,
  };
}

export type UseGameSessionReturn = ReturnType<typeof useGameSession>;
