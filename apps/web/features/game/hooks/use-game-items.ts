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
  canInteract: boolean;
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
  canInteract,
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
      if (!gamification || !currentQuestion || !canInteract || showBossWarning || gameResult !== "playing") {
        return;
      }

      // 1. Kính Hiển Vi (50-50)
      if (type === "50-50") {
        const itemCost = 50;
        if (gold < itemCost) {
          toast.error("Không đủ vàng để sử dụng Kính Hiển Vi!");
          return;
        }

        useItemMutation.mutate(
          { session_id: sessionId, item_name: "microscope", question_id: currentQuestion.id },
          {
            onSuccess: (data) => {
              toast.success("Đã dùng Kính Hiển Vi! 2 đáp án sai đã bị làm mờ.");
              if (data?.hidden_options) {
                setHiddenOptions(data.hidden_options);
              }
              if (data?.updated_gamification) {
                setGamification(data.updated_gamification);
                setGold(data.updated_gamification.gold);
              }
            },
            onError: (err: any) => {
              toast.error(err.message || "Không thể sử dụng vật phẩm lúc này!");
            },
          }
        );
        return;
      }

      // 2. Đóng Băng Thời Gian (+30s)
      if (type === "freeze") {
        const itemCost = 40;
        if (gold < itemCost) {
          toast.error("Không đủ vàng để Đóng Băng Thời Gian!");
          return;
        }

        useItemMutation.mutate(
          { session_id: sessionId, item_name: "time_freeze", question_id: currentQuestion.id },
          {
            onSuccess: (data) => {
              toast.success("Thời gian đã bị đóng băng! Bạn có thêm +30 giây.");
              onFreezeTimer();
              if (data?.updated_gamification) {
                setGamification(data.updated_gamification);
                setGold(data.updated_gamification.gold);
              }
            },
            onError: (err: any) => {
              toast.error(err.message || "Không thể sử dụng vật phẩm lúc này!");
            },
          }
        );
        return;
      }

      // 3. Nhân Phẩm (x2 Điểm)
      if (type === "double") {
        const itemCost = 100;
        if (gold < itemCost) {
          toast.error("Không đủ vàng để mua Nhân Phẩm X2!");
          return;
        }

        useItemMutation.mutate(
          { session_id: sessionId, item_name: "double_points", question_id: currentQuestion.id },
          {
            onSuccess: (data) => {
              toast.success("Kích hoạt bùa Nhân Phẩm! Câu này sẽ được X2 điểm số.");
              setDoubleActive(true);
              if (data?.updated_gamification) {
                setGamification(data.updated_gamification);
                setGold(data.updated_gamification.gold);
              }
            },
            onError: (err: any) => {
              toast.error(err.message || "Không thể sử dụng vật phẩm lúc này!");
            },
          }
        );
        return;
      }

      // 4. Khiên Hộ Mệnh (Chống mất mạng)
      if (type === "shield") {
        const itemCost = 80;
        const shieldUsedInCurrentTier = gamification.shield_used_in_tier?.[String(stage)] || false;

        if (shieldUsedInCurrentTier) {
          toast.error(`Bạn đã sử dụng Khiên ở Tầng ${stage} rồi! Mỗi tầng chỉ được dùng 1 lần.`);
          return;
        }

        if (gold < itemCost) {
          toast.error("Không đủ vàng để tạo Khiên Hộ Mệnh!");
          return;
        }

        useItemMutation.mutate(
          { session_id: sessionId, item_name: "shield", question_id: currentQuestion.id },
          {
            onSuccess: (data) => {
              toast.success("Khiên Hộ Mệnh đã dựng lên! Bảo toàn mạng nếu trả lời sai.");
              setShieldActive(true);
              if (data?.updated_gamification) {
                setGamification(data.updated_gamification);
                setGold(data.updated_gamification.gold);
              }
            },
            onError: (err: any) => {
              toast.error(err.message || "Không thể sử dụng vật phẩm lúc này!");
            },
          }
        );
        return;
      }
    },
    [
      gamification,
      currentQuestion,
      canInteract,
      showBossWarning,
      gameResult,
      gold,
      useItemMutation,
      sessionId,
      stage,
      onFreezeTimer,
      setGamification,
      setGold,
    ]
  );

  return {
    shieldActive,
    setShieldActive,
    doubleActive,
    setDoubleActive,
    hiddenOptions,
    setHiddenOptions,
    resetItemBuffs,
    handleUseItem,
  };
}

export type UseGameItemsReturn = ReturnType<typeof useGameItems>;
