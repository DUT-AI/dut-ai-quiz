import type { Schema } from "@/types/api";

// Core Domain Types mapped directly from FastAPI OpenAPI Contract
export type AttemptOut = Schema<"AttemptOut">;
export type StartAttemptIn = Schema<"StartAttemptIn">;
export type StartAttemptResponse = Schema<"StartAttemptOut">;
export type GetAttemptResponse = Schema<"GetAttemptOut">;
export type AttemptReviewResponse = Schema<"AttemptReviewOut">;
export type ActiveAttempt = Schema<"ActiveAttemptOut">;
export type AttemptAnswer = Schema<"AttemptAnswerOut">;
export type AttemptSavedAnswerItem = Schema<"AttemptSavedAnswerItem">;
export type ShuffledQuestion = Schema<"ShuffledQuestionOut">;
export type ShuffledOption = Schema<"ShuffledOptionOut">;
export type QuestionOptionOut = Schema<"QuestionOptionOut">;

// Component UI aliases for cleaner consumption
export type QuizOption = ShuffledOption | { id: string; text: string; fixed?: boolean };
export type QuizQuestion = ShuffledQuestion & {
  userSelectedOptionId?: string | null;
};

// Shared Exam / Attempt UI types
export interface AttemptHistoryItem {
  exam_title: string;
  attempt: AttemptOut;
}

export type PracticeMode = "practice" | "test" | "study";

export interface PracticeSnapshotItem {
  question_id: string;
  content: string;
  options: QuizOption[];
  difficulty?: string;
  tags?: string[];
}

export interface PracticeSnapshot {
  session_id: string;
  presentation: PracticeSnapshotItem[];
  current_index: number;
}
