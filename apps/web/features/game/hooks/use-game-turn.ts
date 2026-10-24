import { useReducer, useState, useCallback } from "react";
import { toast } from "sonner";

import { usePatchGameAnswer, useActiveGameSession } from "../queries";
import { type BossStatus, getBossName } from "../types";
import { type UseGameSessionReturn } from "./use-game-session";
import {
  gameTurnReducer,
  initialGameTurnState,
  type GameTurnStatus,
} from "./game-turn-reducer";

export interface UseGameTurnProps {
  session: UseGameSessionReturn;
  lessonSlug: string;
}

export function useGameTurn({ session, lessonSlug }: UseGameTurnProps) {
  const patchAnswerMutation = usePatchGameAnswer();
  const { refetch: refetchActiveSession } = useActiveGameSession(lessonSlug, { enabled: false });

  // Finite State Machine cho vòng đời của 1 Turn
  const [turnState, dispatch] = useReducer(gameTurnReducer, initialGameTurnState);

  // Animation / Visual states
  const [bossStatus, setBossStatus] = useState<BossStatus>("idle");
  const [screenShake, setScreenShake] = useState(false);

  const {
    sessionId,
    currentQuestion,
    currentIdx,
    questions,
    stage,
    isBossMode,
    gamification,
    setHp,
    setBossHp,
    setBossMaxHp,
    setScore,
    setGold,
    setStageProgress,
    setCurrentIdx,
    setQuestions,
    setGamification,
    setIsBossMode,
    setShowBossWarning,
    setGameResult,
    setScreen,
  } = session;

  const submitAnswer = useCallback(
    (params: {
      optionId: string;
      timeResponse: number;
      shieldActive?: boolean;
      doubleActive?: boolean;
      onResetBuffs?: () => void;
    }) => {
      // BẢO VỆ CẤP ĐỘ STATE MACHINE: Chỉ nhận lệnh submit khi đang ở QUESTION_ACTIVE
      if (turnState.status !== "QUESTION_ACTIVE" || !currentQuestion) {
        return;
      }

      const { optionId, timeResponse, shieldActive = false, doubleActive = false, onResetBuffs } = params;

      dispatch({ type: "START_SUBMIT", optionId });

      patchAnswerMutation.mutate(
        {
          session_id: sessionId,
          question_id: currentQuestion.id,
          option_id: optionId,
          time_response: timeResponse,
          activate_shield: shieldActive,
          activate_double_points: doubleActive,
        },
        {
          onSuccess: (data) => {
            dispatch({ type: "SUBMIT_SUCCESS", result: data });

            setGamification(data.updated_gamification);
            setGold(data.updated_gamification.gold);
            setScore(data.updated_gamification.points);
            setHp(data.updated_gamification.lives);

            if (data.is_correct) {
              toast.success("Chính xác! Bạn nhận được vàng thưởng.");
              setBossStatus("damage");

              if (isBossMode) {
                setBossHp(0);
                setTimeout(() => setBossStatus("defeat"), 350);
                setTimeout(() => toast.success(`Đã tiêu diệt ${getBossName(stage)}! HP +2 mạng.`), 800);
              }

              setStageProgress((prev) => {
                const copy = [...prev];
                copy[currentIdx] = "correct";
                return copy;
              });
            } else {
              setScreenShake(true);
              setTimeout(() => setScreenShake(false), 500);

              setBossStatus("attack");
              setTimeout(() => setBossStatus("idle"), 1000);

              if (shieldActive) {
                toast.info("Khiên hộ mệnh vỡ tan! Bảo toàn sinh mệnh.");
              } else {
                toast.error(isBossMode ? "Sai rồi! Boss tấn công làm mất 2 mạng." : "Chọn sai rồi! Mất 1 mạng.");
              }

              setStageProgress((prev) => {
                const copy = [...prev];
                copy[currentIdx] = "incorrect";
                return copy;
              });
            }

            if (data.is_game_over) {
              setTimeout(() => {
                setGameResult(data.updated_gamification.lives <= 0 ? "defeat" : "victory");
                setScreen("result");
              }, 1200);
            }

            if (onResetBuffs) {
              onResetBuffs();
            }

            // Nạp trước câu hỏi kế tiếp vào state questions
            if (data.next_question) {
              const nextQ = data.next_question;
              const nextIdx = data.updated_gamification.last_question_index;
              setQuestions((prev) => {
                const copy = [...prev];
                if (nextIdx < copy.length) {
                  copy[nextIdx] = {
                    ...copy[nextIdx],
                    ...nextQ,
                  };
                }
                return copy;
              });
            }
          },
          onError: (err: any) => {
            const errorMsg = err.message || "Lỗi nộp câu trả lời!";
            dispatch({ type: "SUBMIT_FAILURE", error: errorMsg });
            toast.error(errorMsg);
          },
        }
      );
    },
    [
      turnState.status,
      currentQuestion,
      patchAnswerMutation,
      sessionId,
      setGamification,
      setGold,
      setScore,
      setHp,
      isBossMode,
      stage,
      currentIdx,
      setBossHp,
      setStageProgress,
      setGameResult,
      setScreen,
      setQuestions,
    ]
  );

  const nextQuestion = useCallback(
    (onQuestionActivated?: () => void) => {
      if (turnState.status !== "TURN_RESULT" || !gamification) return;

      dispatch({ type: "START_TRANSITION" });

      const nextIdx = gamification.last_question_index;
      if (nextIdx >= questions.length || gamification.lives <= 0) {
        setGameResult(gamification.lives <= 0 ? "defeat" : "victory");
        setScreen("result");
        return;
      }

      const activateNextQuestion = (nextQ: any) => {
        if (nextQ) {
          if (currentQuestion && nextQ.tier > currentQuestion.tier) {
            toast.info(`ẢI TẦNG THỨ ${nextQ.tier}: MỨC ĐỘ ${nextQ.tier === 2 ? "TRUNG BÌNH" : "KHÓ"}`);
          }

          if (nextQ.is_boss) {
            setIsBossMode(true);
            setBossHp(5);
            setBossMaxHp(5);
            setBossStatus("idle");
            setShowBossWarning(true);
          } else {
            setIsBossMode(false);
            setBossHp(0);
          }
        }

        setCurrentIdx(nextIdx);
        if (onQuestionActivated) {
          onQuestionActivated();
        }
        dispatch({ type: "RESET_FOR_NEXT_QUESTION" });
      };

      const existingNextQ = questions[nextIdx];
      // Nếu câu tiếp theo đã được nạp sẵn từ response của PATCH /answers
      if (existingNextQ && existingNextQ.content && existingNextQ.options && existingNextQ.options.length > 0) {
        activateNextQuestion(existingNextQ);
        // Đồng bộ background ngầm không chặn UI
        void refetchActiveSession();
        return;
      }

      // Dự phòng: Nếu chưa có sẵn trong memory thì mới lấy từ GET
      refetchActiveSession().then(({ data: updatedSession }: any) => {
        if (updatedSession?.snapshot) {
          const updatedQuestions = updatedSession.snapshot.questions || [];
          setQuestions((prevQuestions) => {
            return updatedQuestions.map((q: any, i: number) => {
              if (q.content && q.options && q.options.length > 0) {
                return q;
              }
              return prevQuestions[i] || q;
            });
          });
          activateNextQuestion(updatedQuestions[nextIdx]);
        } else {
          dispatch({ type: "RESET_FOR_NEXT_QUESTION" });
        }
      });
    },
    [
      turnState.status,
      gamification,
      questions,
      currentQuestion,
      setGameResult,
      setScreen,
      setCurrentIdx,
      setIsBossMode,
      setBossHp,
      setBossMaxHp,
      setShowBossWarning,
      refetchActiveSession,
      setQuestions,
    ]
  );

  return {
    status: turnState.status as GameTurnStatus,
    selectedOptionId: turnState.selectedOptionId,
    isSelectedCorrect: turnState.isSelectedCorrect,
    correctOptionId: turnState.correctOptionId,
    bossStatus,
    screenShake,
    submitAnswer,
    nextQuestion,
    setBossStatus,
  };
}

export type UseGameTurnReturn = ReturnType<typeof useGameTurn>;
