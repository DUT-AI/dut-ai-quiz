"use client";

import { useState, useCallback } from "react";
import { toast } from "sonner";

import { useUseGameItem } from "../queries";
import {
  type GameQuestion,
  type GamificationState,
  type ItemType,
} from "../types";

export interface UseGameItemsProps {
  sessionId: string;
  currentQuestion: GameQuestion | null;
  gold: number;
  stage: number;
  gamification: GamificationState | null;
  isAnswered: boolean;
  gameResult: string;
  showBossWarning: boolean;
  isBossMode: boolean;
  setGold: React.Dispatch<React.SetStateAction<number>>;
  setGamification: React.Dispatch<React.SetStateAction<GamificationState | null>>;
  onFreezeTimer: () => void;
}

export function useGameItems({
  sessionId,
  currentQuestion,
  gold,
  stage,
  gamification,
  isAnswered,
  gameResult,
  showBossWarning,
  isBossMode,
  setGold,
  setGamification,
  onFreezeTimer,
}: UseGameItemsProps) {
  const useItemMutation = useUseGameItem();

  const [shieldActive, setShieldActive] = useState(false);
  const [doubleActive, setDoubleActive] = useState(false);
  const [hiddenOptions, setHiddenOptions] = useState<string[]>([]);

  // Reset temporary item buffs (called on question change)
  const resetItemBuffs = useCallback(() => {
    setHiddenOptions([]);
    setShieldActive(false);
    setDoubleActive(false);
  }, []);

  const handleUseItem = useCallback(
    (type: ItemType) => {
      if (!gamification || !currentQuestion || isAnswered || showBossWarning || gameResult !== "playing") {
        return;
      }

      // Calculate cost (doubled during boss battles)
      let cost = type === "50-50" ? 50 : type === "freeze" ? 40 : type === "double" ? 100 : 80;
      if (isBossMode) cost *= 2;

      if (gold < cost) {
        toast.error("Không đủ vàng rồi!");
        return;
      }

      // Shield limit check (max 1 per tier)
      if (type === "shield") {
        const shieldUsed = gamification.shield_used_in_tier?.[String(stage)] || false;
        if (shieldUsed || shieldActive) {
          toast.error("Mỗi tầng chỉ được dùng tối đa 1 Khiên Hộ Mệnh!");
          return;
        }
      }

      // 50-50 and Freeze call backend mutation immediately
      if (type === "50-50" || type === "freeze") {
        const itemName = type === "50-50" ? "microscope" : "time_freeze";
        useItemMutation.mutate(
          {
            session_id: sessionId,
            item_name: itemName,
            question_id: currentQuestion.id,
          },
          {
            onSuccess: (data) => {
              setGold(data.gold);
              setGamification((prev) =>
                prev
                  ? {
                      ...prev,
                      gold: data.gold,
                    }
                  : null
              );

              if (type === "50-50") {
                setHiddenOptions(data.eliminated_option_ids);
                toast.info("Kính Hiển Vi kích hoạt! Loại bỏ 2 đáp án sai.");
              } else {
                onFreezeTimer();
                toast.info("Đóng Băng kích hoạt! Thời gian suy nghĩ tạm dừng (cộng 30s).");
              }
            },
            onError: (err: any) => {
              toast.error(err.message || "Không thể sử dụng vật phẩm!");
            },
          }
        );
      } else {
        // Shield and Double Points are activated client-side and submitted with answer
        setGold((prev) => prev - cost);
        if (type === "shield") {
          setShieldActive(true);
          toast.info("Khiên Hộ Mệnh đã kích hoạt! Bảo vệ dũng sĩ ở câu trả lời này.");
        } else {
          setDoubleActive(true);
          toast.info("Bùa Nhân Phẩm đã kích hoạt! Nhân đôi điểm số câu hỏi này.");
        }
      }
    },
    [
      gamification,
      currentQuestion,
      isAnswered,
      showBossWarning,
      gameResult,
      isBossMode,
      gold,
      stage,
      shieldActive,
      useItemMutation,
      sessionId,
      setGold,
      setGamification,
      onFreezeTimer,
    ]
  );

  return {
    shieldActive,
    doubleActive,
    hiddenOptions,
    handleUseItem,
    resetItemBuffs,
    setShieldActive,
    setDoubleActive,
    setHiddenOptions,
  };
}

export type UseGameItemsReturn = ReturnType<typeof useGameItems>;
