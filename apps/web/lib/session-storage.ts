import type { ExamTile, QuizQuestion } from "./types";

const KEY = "dut_quiz_session";

export interface SavedSession {
  attemptId: string;
  selectedExam: ExamTile;
  expiresAt: string;
  questions: QuizQuestion[];
  currentQuestion: number;
  tabOutCount: number;
}

export function saveSession(data: SavedSession): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, JSON.stringify(data));
  } catch {
    /* quota exceeded – bỏ qua */
  }
}

export function loadSession(): SavedSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

export function isSessionValid(s: SavedSession): boolean {
  return new Date(s.expiresAt).getTime() > Date.now();
}
