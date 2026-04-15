"use client";

import { useEffect, useRef } from "react";
import { apiPostJson } from "@/lib/api";
import type { AttemptOut } from "@/lib/types";
import { useQuestionStore } from "@/store/quiz-store";

type FocusResponse = {
  tab_out_count: number;
  action: string;
  attempt?: {
    status: string | null;
    score: number | null;
    completed_at: string | null;
  };
};

/**
 * Gửi visibility_hidden theo anti-cheat; nếu server auto-submit thì đồng bộ UI.
 */
export function useTabOut(attemptId: string | null) {
  const applyAutoSubmit = useQuestionStore((s) => s.applyAutoSubmit);
  const lastHidden = useRef(0);

  useEffect(() => {
    if (!attemptId) return;

    const onVis = () => {
      if (document.visibilityState !== "hidden") return;
      const now = Date.now();
      if (now - lastHidden.current < 400) return;
      lastHidden.current = now;

      const client_event_id =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : `evt-${now}-${Math.random().toString(36).slice(2)}`;

      void (async () => {
        try {
          const out = await apiPostJson<FocusResponse>(
            `/api/v1/attempts/${attemptId}/focus-events`,
            {
              event: "visibility_hidden",
              client_event_id,
              client_ts: new Date().toISOString(),
            }
          );
          if (out.action === "AUTO_SUBMITTED" && out.attempt) {
            const score = out.attempt.score ?? 0;
            const pseudo: AttemptOut = {
              id: attemptId,
              exam_id: "",
              user_id: 0,
              started_at: "",
              completed_at: out.attempt.completed_at,
              expires_at: "",
              score,
              status: out.attempt.status ?? "COMPLETED",
              tab_out_count: out.tab_out_count,
            };
            applyAutoSubmit(score, pseudo);
          }
        } catch {
          /* ignore network errors for tab events */
        }
      })();
    };

    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [attemptId, applyAutoSubmit]);
}
