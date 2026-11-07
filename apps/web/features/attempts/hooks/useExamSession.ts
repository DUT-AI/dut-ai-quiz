"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { usePatchAnswers, useSubmitAttempt } from "@/lib/queries";
import type { AttemptSavedAnswerItem } from "../types";

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
  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prevAnswersRef = useRef<Record<string, string | null>>({});

  const patchAnswers = usePatchAnswers();
  const submitAttempt = useSubmitAttempt();

  // Restore saved answers from server
  useEffect(() => {
    if (initialAnswers && initialAnswers.length > 0) {
      const restored: Record<string, string | null> = {};
      for (const a of initialAnswers) {
        restored[a.question_id] = a.selected_option_id ?? null;
      }
      setAnswers((prev) => {
        const merged = { ...restored, ...prev };
        prevAnswersRef.current = { ...merged };
        return merged;
      });
    }
  }, [initialAnswers]);

  // Debounced auto-save
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
    }, 1500);

    return () => clearTimeout(timeout);
  }, [answers, attemptId, patchAnswers, isSubmitting]);

  // Navigation Guarding
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isSubmitting) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isSubmitting]);

  const setAnswer = useCallback((questionId: string, optionId: string | null) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionId }));
  }, []);

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
      return { success: true, data: res };
    } catch (err: any) {
      setIsSubmitting(false);
      return {
        success: false,
        error: err.message || "Nộp bài thất bại. Vui lòng thử lại.",
      };
    }
  }, [attemptId, syncUnsavedAnswers, submitAttempt]);

  const autoSubmit = useCallback(async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await syncUnsavedAnswers();
      await submitAttempt.mutateAsync(attemptId);
    } catch (err) {
      console.error("Auto submit failed:", err);
    } finally {
      if (onAutoSubmitFinished) {
        onAutoSubmitFinished();
      }
    }
  }, [attemptId, isSubmitting, syncUnsavedAnswers, submitAttempt, onAutoSubmitFinished]);

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
