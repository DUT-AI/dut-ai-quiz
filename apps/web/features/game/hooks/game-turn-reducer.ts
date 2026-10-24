import { type GamificationAnswerResult } from "../types";

export type GameTurnStatus =
  | "IDLE"              // Chưa bắt đầu / đang tải
  | "QUESTION_ACTIVE"   // Đang đếm giờ, sẵn sàng nhận đáp án
  | "SUBMITTING"        // Đang gửi đáp án lên server, khóa toàn bộ click
  | "TURN_RESULT"       // Đã có kết quả, đang hiển thị đúng/sai & nút 'Tiếp tục hành trình'
  | "TRANSITIONING"     // Đang chuyển sang câu hỏi tiếp theo
  | "GAME_OVER";        // Trận đấu kết thúc (thắng hoặc thua)

export interface GameTurnState {
  status: GameTurnStatus;
  selectedOptionId: string | null;
  isSelectedCorrect: boolean;
  correctOptionId: string | null;
  lastResult: GamificationAnswerResult | null;
  errorMessage: string | null;
}

export const initialGameTurnState: GameTurnState = {
  status: "QUESTION_ACTIVE",
  selectedOptionId: null,
  isSelectedCorrect: false,
  correctOptionId: null,
  lastResult: null,
  errorMessage: null,
};

export type GameTurnAction =
  | { type: "START_SUBMIT"; optionId: string }
  | { type: "SUBMIT_SUCCESS"; result: GamificationAnswerResult }
  | { type: "SUBMIT_FAILURE"; error: string }
  | { type: "START_TRANSITION" }
  | { type: "RESET_FOR_NEXT_QUESTION" }
  | { type: "TRIGGER_GAME_OVER" };

export function gameTurnReducer(
  state: GameTurnState,
  action: GameTurnAction
): GameTurnState {
  switch (action.type) {
    case "START_SUBMIT": {
      // Chỉ cho phép submit khi turn đang ở trạng thái QUESTION_ACTIVE
      if (state.status !== "QUESTION_ACTIVE") {
        return state;
      }
      return {
        ...state,
        status: "SUBMITTING",
        selectedOptionId: action.optionId,
        errorMessage: null,
      };
    }

    case "SUBMIT_SUCCESS": {
      // Chỉ chấp nhận kết quả khi đang ở SUBMITTING
      if (state.status !== "SUBMITTING") {
        return state;
      }
      const isGameOver = action.result.is_game_over;
      return {
        ...state,
        status: isGameOver ? "GAME_OVER" : "TURN_RESULT",
        isSelectedCorrect: action.result.is_correct,
        correctOptionId: action.result.correct_option_id ?? null,
        lastResult: action.result,
        errorMessage: null,
      };
    }

    case "SUBMIT_FAILURE": {
      if (state.status !== "SUBMITTING") {
        return state;
      }
      // Gặp lỗi mạng hoặc request fail -> mở lại trạng thái QUESTION_ACTIVE để user thử lại
      return {
        ...state,
        status: "QUESTION_ACTIVE",
        selectedOptionId: null,
        errorMessage: action.error,
      };
    }

    case "START_TRANSITION": {
      if (state.status !== "TURN_RESULT") {
        return state;
      }
      return {
        ...state,
        status: "TRANSITIONING",
      };
    }

    case "RESET_FOR_NEXT_QUESTION": {
      return {
        status: "QUESTION_ACTIVE",
        selectedOptionId: null,
        isSelectedCorrect: false,
        correctOptionId: null,
        lastResult: null,
        errorMessage: null,
      };
    }

    case "TRIGGER_GAME_OVER": {
      return {
        ...state,
        status: "GAME_OVER",
      };
    }

    default:
      return state;
  }
}
