/** Khớp ExamOut từ API */
export interface ExamOut {
  id: string;
  title: string;
  description: string;
  start_time: string | null;
  end_time: string | null;
  duration_minutes: number;
  max_attempts: number;
  is_published: boolean;
  created_by: number;
}

export interface QuizOption {
  id: string;
  text: string;
}

/** Một câu sau khi shuffle (presentation) */
export interface QuizQuestion {
  question_id: string;
  content: string;
  options: QuizOption[];
  userSelectedOptionId?: string | null;
}

/** Hiển thị ô chọn đề trên trang chủ */
export interface ExamTile {
  id: string;
  title: string;
  icon: string;
}

export interface StartAttemptResponse {
  attempt_id: string;
  expires_at: string;
  tab_out_count: number;
  questions: {
    question_id: string;
    content: string;
    options: QuizOption[];
    difficulty: string;
    tags: string[];
  }[];
}

export interface AttemptOut {
  id: string;
  exam_id: string;
  user_id: number;
  started_at: string;
  completed_at: string | null;
  expires_at: string;
  score: number | null;
  status: string;
  tab_out_count: number;
}
