"use client";
import { create } from "zustand";
import { apiPost, apiPatch } from "@/lib/api";
import type { PracticeSnapshot, QuizQuestion } from "@/lib/types";

interface GameState {
  sessionId: string | null;
  questions: QuizQuestion[];
  currentQuestion: number;
  hasFinished: boolean;
  loading: boolean;
  error: string | null;
  snapshot: PracticeSnapshot | null;

  startSession: (opts: {
    lessonSlug: string;
  }) => Promise<void>;
  selectAnswer: (questionId: string, optionId: string) => Promise<void>;
  goNext: () => void;
  goPrev: () => void;
  finish: () => Promise<void>;
  reset: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  sessionId: null,
  questions: [],
  currentQuestion: 0,
  hasFinished: false,
  loading: false,
  error: null,
  snapshot: null,

  startSession: async ({
    lessonSlug,
  }) => {
    set({ loading: true, error: null });
    try {
      const res = await apiPost<{
        session_id: string;
        snapshot: PracticeSnapshot;
      }>("/api/v1/game/sessions", {
        lesson_slug: lessonSlug,
      });
      const questions: QuizQuestion[] = res.snapshot.presentation.map((p) => ({
        question_id: p.question_id,
        content: p.content,
        options: p.options,
        userSelectedOptionId: undefined,
      }));
      set({
        sessionId: res.session_id,
        snapshot: res.snapshot,
        questions,
        currentQuestion: 0,
        hasFinished: false,
        loading: false,
      });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi kết nối";
      set({ loading: false, error: msg });
    }
  },

  selectAnswer: async (questionId, optionId) => {
    const { sessionId, questions } = get();
    if (!sessionId) return;

    set({
      questions: questions.map((q) =>
        q.question_id === questionId
          ? { ...q, userSelectedOptionId: optionId }
          : q
      ),
    });

    try {
      await apiPatch(`/api/v1/game/sessions/${sessionId}/answers`, {
        answers: [{ question_id: questionId, selected_option_id: optionId }],
      });
    } catch {
      /* non-critical */
    }
  },

  goNext: () => {
    const { currentQuestion, questions } = get();
    if (currentQuestion < questions.length - 1)
      set({ currentQuestion: currentQuestion + 1 });
  },

  goPrev: () => {
    const { currentQuestion } = get();
    if (currentQuestion > 0) set({ currentQuestion: currentQuestion - 1 });
  },

  finish: async () => {
    const { sessionId } = get();
    if (!sessionId) return;
    set({ loading: true });
    try {
      await apiPost(`/api/v1/game/sessions/${sessionId}/finish`, {});
      set({ hasFinished: true, loading: false });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Lỗi khi nộp bài";
      set({ loading: false, error: msg });
    }
  },

  reset: () =>
    set({
      sessionId: null,
      questions: [],
      currentQuestion: 0,
      hasFinished: false,
      loading: false,
      error: null,
      snapshot: null,
    }),
}));
