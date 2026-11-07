"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { parseICT } from "@/lib/utils";

interface UseExamTimerOptions {
  expiresAt?: string;
  serverTime?: string;
  isSubmitting?: boolean;
  onExpire?: () => void;
}

export function useExamTimer({
  expiresAt,
  serverTime,
  isSubmitting = false,
  onExpire,
}: UseExamTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const onExpireRef = useRef(onExpire);
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Initialize and synchronize with server clock skew
  useEffect(() => {
    if (!expiresAt) return;

    const expireTime = parseICT(expiresAt).getTime();
    const serverTimestamp = serverTime ? parseICT(serverTime).getTime() : Date.now();
    const clientTimestamp = Date.now();
    const clockSkew = clientTimestamp - serverTimestamp;

    // Adjusted client now
    const adjustedNow = Date.now() - clockSkew;
    const diff = Math.max(0, Math.floor((expireTime - adjustedNow) / 1000));
    setTimeLeft(diff);
  }, [expiresAt, serverTime]);

  // Tick timer
  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || isSubmitting) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(timer);
          if (onExpireRef.current) {
            onExpireRef.current();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, isSubmitting]);

  const formatTime = useCallback((seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h > 0 ? h + ":" : ""}${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }, []);

  return {
    timeLeft,
    formatTime,
  };
}
