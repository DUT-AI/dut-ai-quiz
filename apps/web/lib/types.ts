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
  participant_ids: number[];
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

export interface Lesson {
  id: string;
  name: string;
  description?: string;
  order: number;
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

export interface QuestionCreate {
  content: string;
  options: any[];
  difficulty?: string;
  tags?: string[];
  lesson_id?: string | null;
  pool_type?: PoolType;
  solution?: string;
}

export type PoolType = "PRACTICE" | "EXAM";

export interface QuestionOut {
  id: string;
  content: string;
  options: any[];
  difficulty: string;
  tags: string[];
  lesson_id?: string;
  pool_type?: PoolType;
  solution?: string | null;
}

export interface ExamCreate {
  title: string;
  description: string;
  start_time?: string | null;
  end_time?: string | null;
  duration_minutes?: number;
  max_attempts?: number;
  is_published?: boolean;
  participant_ids?: number[];
}

export interface LeaderboardEntry {
  user_id: number;
  username: string;
  score: number;
  best_score: number;
  completed_at: string;
}

export interface UserMe {
  id: number;
  username: string;
  fullname: string;
  name: string;
  role_name: string;
  quiz_role: string;
}

export interface AttemptReviewResponse {
  attempt: AttemptOut;
  answers: {
    question_id: string;
    selected_option_id: string | null;
  }[];
  questions: {
    id: string;
    content: string;
    options: {
      id: string;
      text: string;
      is_correct: boolean | string | number;
    }[];
    solution?: string | null;
  }[];
}

export interface AttemptHistoryItem {
  exam_title: string;
  attempt: {
    id: string;
    exam_id: string;
    started_at: string;
    completed_at: string | null;
    score: number | null;
    status: string;
    tab_out_count: number;
    expires_at: string;
  };
}

export interface ExamStats {
  summary: {
    total_assigned: number;
    total_started: number;
    total_completed: number;
    average_score: number;
    max_score: number;
  };
  score_distribution: {
    range: string;
    count: number;
  }[];
  participants: {
    user_id: number;
    attempts_count: number;
    best_score: number | null;
    max_tab_out: number;
  }[];
  question_stats: {
    question_id: string;
    content: string;
    correct_rate: number;
  }[];
}

export interface ExternalTeam {
  id: number;
  team_name: string;
  member_count: number;
  members: {
    user_id: number;
    username: string;
  }[];
}

export interface ExternalUser {
  id: number;
  username: string;
  name: string;
  email: string;
  avatar_url?: string | null;
}
