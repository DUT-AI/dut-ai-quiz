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

export interface ExamCreate {
  title: string;
  description?: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  max_attempts?: number;
  is_published?: boolean;
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

export interface AttemptHistoryItem {
  attempt: AttemptOut;
  exam_title: string;
}

export interface AttemptAnswer {
  id: string;
  attempt_id: string;
  question_id: string;
  selected_option_id: string | null;
}

export interface AttemptReviewResponse {
  attempt: AttemptOut;
  answers: AttemptAnswer[];
  questions: QuestionOut[];
}

export interface Lesson {
  id: string;
  name: string;
  description: string;
  order: number;
  created_at: string;
}

export interface UserMe {
  id: number;
  email: string;
  name: string;
  role: string;
  quiz_role: string;
}

export interface QuestionOut {
  id: string;
  pool_type: string;
  content: string;
  options: {
    id: string;
    text: string;
    is_correct: boolean;
  }[];
  solution: string | null;
  tags: string[];
  created_at: string;
}

export interface QuestionCreate {
  pool_type: string;
  content: string;
  options: {
    text: string;
    is_correct: boolean;
  }[];
  solution?: string;
  tags?: string[];
  lesson_id?: string;
}

export interface LeaderboardEntry {
  user_name: string;
  score: number;
  completed_at: string;
}

export interface ExternalTeamMember {
  user_id: number;
  user_name: string;
  email: string;
  user_avatar: string | null;
}

export interface ExternalTeam {
  id: number;
  team_name: string;
  member_count: number;
  members: ExternalTeamMember[];
}

export interface ExternalUser {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
  role_name: string;
}

export interface ExamStats {
  summary: {
    total_assigned: number;
    total_started: number;
    total_completed: number;
    average_score: number;
    max_score: number;
  };
  score_distribution: { range: string; count: number }[];
  participants: {
    user_id: number;
    best_score: number | null;
    attempts_count: number;
    last_status: string;
    max_tab_out: number;
  }[];
  question_stats: {
    question_id: string;
    content: string;
    correct_rate: number;
  }[];
}
