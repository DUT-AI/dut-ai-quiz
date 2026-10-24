"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { usePatchGameAnswer, useActiveGameSession } from "../queries";
import { type BossStatus, getBossName } from "../types";
import { type UseGameSessionReturn } from "./use-game-session";
import { type UseGameTimerReturn } from "./use-game-timer";
import { type UseGameItemsReturn } from "./use-game-items";

export interface UseGameTurnProps {
  session: UseGameSessionReturn;
  timer: UseGameTimerReturn;
  items: UseGameItemsReturn;
  lessonSlug: string;
}

export function useGameTurn({
  session,
  timer,
  items,
  lessonSlug,
}: UseGameTurnProps) {
  const patchAnswerMutation = usePatchGameAnswer();
  const { refetch: refetchActiveSession } = useActiveGameSession(lessonSlug, { enabled: false });

  const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isSelectedCorrect, setIsSelectedCorrect] = useState(false);
  const [correctOptionId, setCorrectOptionId] = useState<string | null>(null);
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
    (optionId: string) => {
      if (isAnswered || patchAnswerMutation.isPending || !currentQuestion) return;
      setSelectedOptionId(optionId);

      const timeResponse = timer.timerMax - timer.timeLeftRef.current;

      patchAnswerMutation.mutate(
        {
          session_id: sessionId,
          question_id: currentQuestion.id,
          option_id: optionId,
          time_response: timeResponse,
          activate_shield: items.shieldActive,
          activate_double_points: items.doubleActive,
        },
        {
          onSuccess: (data) => {
            setIsSelectedCorrect(data.is_correct);
            setCorrectOptionId(data.correct_option_id ?? null);
            setIsAnswered(true);
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

              if (items.shieldActive) {
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

            items.setShieldActive(false);
            items.setDoubleActive(false);
          },
          onError: (err: any) => {
            toast.error(err.message || "Lỗi nộp câu trả lời!");
            setIsAnswered(false);
            setSelectedOptionId(null);
          },
        }
      );
    },
    [
      isAnswered,
      patchAnswerMutation,
      currentQuestion,
      timer.timerMax,
      timer.timeLeftRef,
      sessionId,
      items,
      isBossMode,
      stage,
      currentIdx,
      setGamification,
      setGold,
      setScore,
      setHp,
      setBossHp,
      setStageProgress,
      setGameResult,
      setScreen,
    ]
  );

  const handleTimeOut = useCallback(() => {
    toast.error("Hết thời gian suy nghĩ mất rồi!");
    submitAnswer("");
  }, [submitAnswer]);

  const nextQuestion = useCallback(() => {
    if (!gamification) return;

    const nextIdx = gamification.last_question_index;
    if (nextIdx >= questions.length || gamification.lives <= 0) {
      setGameResult(gamification.lives <= 0 ? "defeat" : "victory");
      setScreen("result");
      return;
    }

    refetchActiveSession().then(({ data: updatedSession }: any) => {
      if (updatedSession?.snapshot) {
        const updatedQuestions = updatedSession.snapshot.questions;
        setQuestions(updatedQuestions);

        const nextQ = updatedQuestions[nextIdx];
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
        setIsAnswered(false);
        setSelectedOptionId(null);
        setCorrectOptionId(null);
        items.resetItemBuffs();
        timer.setTimerFrozen(false);
      }
    });
  }, [
    gamification,
    questions.length,
    refetchActiveSession,
    currentQuestion,
    items,
    timer,
    setGameResult,
    setScreen,
    setQuestions,
    setCurrentIdx,
    setIsBossMode,
    setBossHp,
    setBossMaxHp,
    setShowBossWarning,
  ]);

  return {
    selectedOptionId,
    isAnswered,
    isSelectedCorrect,
    correctOptionId,
    bossStatus,
    screenShake,
    submitAnswer,
    handleTimeOut,
    nextQuestion,
    setIsAnswered,
    setSelectedOptionId,
    setBossStatus,
  };
}

export type UseGameTurnReturn = ReturnType<typeof useGameTurn>;
