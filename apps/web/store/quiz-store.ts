import { create } from "zustand";
import { apiJson, apiPatchJson, apiPostJson } from "@/lib/api";
import type {
  AttemptOut,
  ExamOut,
  ExamTile,
  QuizQuestion,
  StartAttemptResponse,
} from "@/lib/types";

const ICONS = [
  "/assets/images/icon-html.svg",
  "/assets/images/icon-css.svg",
  "/assets/images/icon-js.svg",
  "/assets/images/icon-accessibility.svg",
];

function toExamTiles(exams: ExamOut[]): ExamTile[] {
  return exams.map((e, i) => ({
    id: e.id,
    title: e.title,
    icon: ICONS[i % ICONS.length],
  }));
}

interface State {
  exams: ExamTile[];
  examsRaw: ExamOut[];
  listError: string | null;
  listLoading: boolean;

  selectedExam: ExamTile | null;
  attemptId: string | null;
  expiresAt: string | null;
  tabOutCount: number;

  questions: QuizQuestion[];
  currentQuestion: number;
  hasCompleteAll: boolean;
  finalScore: number | null;
  attemptResult: AttemptOut | null;

  sessionError: string | null;
  sessionLoading: boolean;

  fetchExams: () => Promise<void>;
  selectExam: (exam: ExamTile) => Promise<void>;
  selectAnswer: (questionId: string, optionId: string) => Promise<void>;
  goNextQuestion: () => void;
  goPreviousQuestion: () => void;
  finishQuiz: () => Promise<void>;
  applyAutoSubmit: (score: number, attempt: AttemptOut) => void;
  reset: () => void;
}

const initialQuizSlice = {
  selectedExam: null,
  attemptId: null,
  expiresAt: null,
  tabOutCount: 0,
  questions: [] as QuizQuestion[],
  currentQuestion: 0,
  hasCompleteAll: false,
  finalScore: null,
  attemptResult: null,
  sessionError: null,
  sessionLoading: false,
};

export const useQuestionStore = create<State>()((set, get) => ({
  exams: [],
  examsRaw: [],
  listError: null,
  listLoading: false,
  ...initialQuizSlice,

  fetchExams: async () => {
    set({ listLoading: true, listError: null });
    try {
      const rows = await apiJson<ExamOut[]>("/api/v1/exams");
      set({
        examsRaw: rows,
        exams: toExamTiles(rows),
        listLoading: false,
      });
    } catch (e) {
      set({
        listError: e instanceof Error ? e.message : "Không tải được danh sách đề",
        listLoading: false,
      });
    }
  },

  selectExam: async (exam: ExamTile) => {
    set({ sessionLoading: true, sessionError: null });
    try {
      const data = await apiPostJson<StartAttemptResponse>(
        `/api/v1/exams/${exam.id}/attempts`,
        {}
      );
      const questions: QuizQuestion[] = data.questions.map((q) => ({
        question_id: q.question_id,
        content: q.content,
        options: q.options.map((o) => ({ id: o.id, text: o.text })),
        userSelectedOptionId: null,
      }));
      set({
        selectedExam: exam,
        attemptId: data.attempt_id,
        expiresAt: data.expires_at,
        tabOutCount: data.tab_out_count,
        questions,
        currentQuestion: 0,
        hasCompleteAll: false,
        finalScore: null,
        attemptResult: null,
        sessionLoading: false,
      });
    } catch (e) {
      set({
        sessionError: e instanceof Error ? e.message : "Không bắt đầu được bài",
        sessionLoading: false,
      });
    }
  },

  selectAnswer: async (questionId: string, optionId: string) => {
    const { attemptId, questions } = get();
    if (!attemptId) return;

    const next = structuredClone(questions);
    const idx = next.findIndex((q) => q.question_id === questionId);
    if (idx === -1) return;
    next[idx] = { ...next[idx], userSelectedOptionId: optionId };
    set({ questions: next });

    await apiPatchJson(`/api/v1/attempts/${attemptId}/answers`, {
      answers: [{ question_id: questionId, selected_option_id: optionId }],
    });
  },

  goNextQuestion: () => {
    const { currentQuestion, questions } = get();
    const n = currentQuestion + 1;
    if (n < questions.length) set({ currentQuestion: n });
  },

  goPreviousQuestion: () => {
    const { currentQuestion } = get();
    const p = currentQuestion - 1;
    if (p >= 0) set({ currentQuestion: p });
  },

  finishQuiz: async () => {
    const { attemptId } = get();
    if (!attemptId) return;
    try {
      const att = await apiPostJson<AttemptOut>(
        `/api/v1/attempts/${attemptId}/submit`,
        {}
      );
      set({
        hasCompleteAll: true,
        finalScore: att.score ?? 0,
        attemptResult: att,
        currentQuestion: 0,
      });
    } catch (e) {
      set({
        sessionError: e instanceof Error ? e.message : "Nộp bài thất bại",
      });
    }
  },

  applyAutoSubmit: (score: number, attempt: AttemptOut) => {
    set({
      hasCompleteAll: true,
      finalScore: score,
      attemptResult: attempt,
      currentQuestion: 0,
    });
  },

  reset: () => {
    set({
      ...initialQuizSlice,
    });
  },
}));
