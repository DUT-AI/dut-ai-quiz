"use client";

import { useEffect, useState } from "react";

export interface CountdownResult {
  remaining: number; // giây còn lại
  display: string;   // "MM:SS"
  isExpired: boolean;
  isWarning: boolean; // < 60s
  isCritical: boolean; // < 10s
}

function calcRemaining(expiresAt: string): number {
  return Math.max(
    0,
    Math.floor((new Date(expiresAt).getTime() - Date.now()) / 1000)
  );
}

export function useCountdown(expiresAt: string | null): CountdownResult {
  const [remaining, setRemaining] = useState(() =>
    expiresAt ? calcRemaining(expiresAt) : 0
  );

  useEffect(() => {
    if (!expiresAt) return;
    setRemaining(calcRemaining(expiresAt));

    const id = setInterval(() => {
      const secs = calcRemaining(expiresAt);
      setRemaining(secs);
      if (secs === 0) clearInterval(id);
    }, 1000);

    return () => clearInterval(id);
  }, [expiresAt]);

  const mm = String(Math.floor(remaining / 60)).padStart(2, "0");
  const ss = String(remaining % 60).padStart(2, "0");

  return {
    remaining,
    display: `${mm}:${ss}`,
    isExpired: remaining === 0 && !!expiresAt,
    isWarning: remaining > 0 && remaining <= 60,
    isCritical: remaining > 0 && remaining <= 10,
  };
}
