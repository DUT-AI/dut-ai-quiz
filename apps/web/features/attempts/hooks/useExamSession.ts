"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePatchAnswers, useSubmitAttempt } from "@/lib/queries";
import type { AttemptSavedAnswerItem } from "../types";

const LOCAL_STORAGE_PREFIX = "exam_progress_";

interface LocalExamProgress {
  attemptId: string;
  answers: Record<string, string | null>;
  lastUpdated: number;
}

interface UseExamSessionOptions {
  attemptId: string;
  initialAnswers?: AttemptSavedAnswerItem[];
  onAutoSubmitFinished?: () => void;
}

export function useExamSession({
  attemptId,
  initialAnswers,
  onAutoSubmitFinished,
}: UseExamSessionOptions) {
  const [answers, setAnswers] = useState<Record<string, string | null>>(() => {
    if (typeof window === "undefined" || !attemptId) return {};
    try {
      const raw = localStorage.getItem(`${LOCAL_STORAGE_PREFIX}${attemptId}`);
      if (raw) {
        const parsed: LocalExamProgress = JSON.parse(raw);
        if (parsed && typeof parsed.answers === "object") {
          return parsed.answers;
        }
      }
    } catch {
      // ignore JSON errors
    }
    return {};
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevAnswersRef = useRef<Record<string, string | null>>({});
  const answersRef = useRef<Record<string, string | null>>(answers);
  answersRef.current = answers;

  const patchAnswers = usePatchAnswers();
  const submitAttempt = useSubmitAttempt();

  // Reconcile saved answers from server when initialAnswers arrives
  useEffect(() => {
    if (!initialAnswers || initialAnswers.length === 0) return;

    const serverAnswers: Record<string, string | null> = {};
    for (const a of initialAnswers) {
      serverAnswers[a.question_id] = a.selected_option_id ?? null;
    }

    setAnswers((currentAnswers) => {
      // Merge strategy: local answers take precedence if already selected, otherwise take server answers
      const merged = { ...serverAnswers, ...currentAnswers };
      prevAnswersRef.current = { ...merged };
      
      // Update local storage with full merged state
      if (typeof window !== "undefined" && attemptId) {
        try {
          const payload: LocalExamProgress = {
            attemptId,
            answers: merged,
            lastUpdated: Date.now(),
          };
          localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${attemptId}`, JSON.stringify(payload));
        } catch {
          // ignore
        }
      }
      return merged;
    });
  }, [initialAnswers, attemptId]);

  // Debounced auto-save (reduced to 300ms for rapid persistence)
  useEffect(() => {
    if (isSubmitting) return;
    const changedIds = Object.keys(answers).filter(
      (id) => answers[id] !== prevAnswersRef.current[id]
    );
    if (changedIds.length === 0) return;

    const timeout = setTimeout(() => {
      if (isSubmitting) return;
      const payload = changedIds.map((id) => ({
        question_id: id,
        selected_option_id: answers[id],
      }));
      patchAnswers.mutate({ attemptId, answers: payload });
      prevAnswersRef.current = { ...answers };
    }, 300);

    return () => clearTimeout(timeout);
  }, [answers, attemptId, patchAnswers, isSubmitting]);

  // Flush pending answers on beforeunload using keepalive fetch
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSubmitting) return;

      // 1. Navigation prompt
      e.preventDefault();
      e.returnValue = "";

      // 2. Immediate network flush via keepalive fetch
      const current = answersRef.current;
      const prev = prevAnswersRef.current;
      const changedIds = Object.keys(current).filter(
        (id) => current[id] !== prev[id]
      );

      if (changedIds.length > 0 && attemptId) {
        const payload = changedIds.map((id) => ({
          question_id: id,
          selected_option_id: current[id],
        }));

        try {
          fetch(`/api/v1/attempts/${attemptId}/answers`, {
            method: "PATCH",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ answers: payload }),
            keepalive: true,
          });
          prevAnswersRef.current = { ...current };
        } catch (err) {
          console.error("Keepalive flush error:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [attemptId, isSubmitting]);

  // Set answer with synchronous localStorage write
  const setAnswer = useCallback(
    (questionId: string, optionId: string | null) => {
      setAnswers((prev) => {
        const next = { ...prev, [questionId]: optionId };
        if (typeof window !== "undefined" && attemptId) {
          try {
            const payload: LocalExamProgress = {
              attemptId,
              answers: next,
              lastUpdated: Date.now(),
            };
            localStorage.setItem(`${LOCAL_STORAGE_PREFIX}${attemptId}`, JSON.stringify(payload));
          } catch {
            // ignore
          }
        }
        return next;
      });
    },
    [attemptId]
  );

  const cleanupLocalProgress = useCallback(() => {
    if (typeof window !== "undefined" && attemptId) {
      try {
        localStorage.removeItem(`${LOCAL_STORAGE_PREFIX}${attemptId}`);
      } catch {
        // ignore
      }
    }
  }, [attemptId]);

  const syncUnsavedAnswers = useCallback(async () => {
    const changedIds = Object.keys(answers).filter(
      (id) => answers[id] !== prevAnswersRef.current[id]
    );
    if (changedIds.length > 0) {
      const payload = changedIds.map((id) => ({
        question_id: id,
        selected_option_id: answers[id],
      }));
      await patchAnswers.mutateAsync({ attemptId, answers: payload });
      prevAnswersRef.current = { ...answers };
    }
  }, [answers, attemptId, patchAnswers]);

  const submit = useCallback(async () => {
    setIsSubmitting(true);
    try {
      await syncUnsavedAnswers();
      const res = await submitAttempt.mutateAsync(attemptId);
      cleanupLocalProgress();
      return { success: true, data: res };
    } catch (err: any) {
      setIsSubmitting(false);
      return {
        success: false,
        error: err.message || "Nộp bài thất bại. Vui lòng thử lại.",
      };
    }
  }, [attemptId, syncUnsavedAnswers, submitAttempt, cleanupLocalProgress]);

  const autoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await syncUnsavedAnswers();
      await submitAttempt.mutateAsync(attemptId);
      cleanupLocalProgress();
    } catch (err) {
      console.error("Auto submit failed:", err);
    } finally {
      if (onAutoSubmitFinished) {
        onAutoSubmitFinished();
      }
    }
  }, [attemptId, isSubmitting, syncUnsavedAnswers, submitAttempt, onAutoSubmitFinished, cleanupLocalProgress]);

  const answeredCount = useMemo(
    () => Object.keys(answers).filter((id) => answers[id]).length,
    [answers]
  );

  return {
    answers,
    setAnswer,
    isSubmitting,
    submit,
    autoSubmit,
    answeredCount,
    prevAnswersRef,
  };
}
