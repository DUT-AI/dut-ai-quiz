"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { type GameQuestion } from "../types";

export interface UseGameTimerProps {
  currentQuestion: GameQuestion | null;
  currentIdx: number;
  isAnswered: boolean;
  onTimeOut: () => void;
}

export function useGameTimer({
  currentQuestion,
  currentIdx,
  isAnswered,
  onTimeOut,
}: UseGameTimerProps) {
  const timeLeftRef = useRef<number>(60);
  const [timerFrozen, setTimerFrozen] = useState(false);

  const timerMax =
    currentQuestion?.time_limit || (currentQuestion?.is_boss ? 30 : 60);

  // Sync timeLeftRef and unfreeze whenever the current question changes
  useEffect(() => {
    if (currentQuestion) {
      timeLeftRef.current = currentQuestion.time_limit;
      setTimerFrozen(false);
    }
  }, [currentIdx, currentQuestion]);

  // Support item: Freeze timer and give +30 seconds
  const freezeTimerFor30Seconds = useCallback(() => {
    setTimerFrozen(true);
    timeLeftRef.current += 30;
  }, []);

  return {
    timeLeftRef,
    timerFrozen,
    setTimerFrozen,
    timerMax,
    freezeTimerFor30Seconds,
  };
}

export type UseGameTimerReturn = ReturnType<typeof useGameTimer>;
