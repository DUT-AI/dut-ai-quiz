"use client";

import { useReducer, useCallback } from "react";
import { toast } from "sonner";

import { useUseGameItem } from "../queries";
import {
  type GameQuestion,
  type GamificationState,
  type ItemType,
} from "../types";
import { GAME_ITEMS_CONFIG } from "../game-items.config";

export interface GameItemsState {
  activeBuffs: Partial<Record<ItemType, boolean>>;
  hiddenOptions: string[];
}

export type GameItemsAction =
  | { type: "ACTIVATE_BUFF"; item: ItemType }
  | { type: "SET_HIDDEN_OPTIONS"; optionIds: string[] }
  | { type: "RESET_BUFFS" };

export const initialGameItemsState: GameItemsState = {
  activeBuffs: {},
  hiddenOptions: [],
};

export function gameItemsReducer(
  state: GameItemsState,
  action: GameItemsAction
): GameItemsState {
  switch (action.type) {
    case "ACTIVATE_BUFF":
      return {
        ...state,
        activeBuffs: {
          ...state.activeBuffs,
          [action.item]: true,
        },
      };
    case "SET_HIDDEN_OPTIONS":
      return {
        ...state,
        hiddenOptions: action.optionIds,
      };
    case "RESET_BUFFS":
      return initialGameItemsState;
    default:
      return state;
  }
}

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
  setGamification,
  onFreezeTimer,
}: UseGameItemsProps) {
  const useItemMutation = useUseGameItem();
  const [state, dispatch] = useReducer(gameItemsReducer, initialGameItemsState);

  // Reset temporary item buffs (called on question change)
  const resetItemBuffs = useCallback(() => {
    dispatch({ type: "RESET_BUFFS" });
  }, []);

  const handleUseItem = useCallback(
    (type: ItemType) => {
      if (
        !gamification ||
        !currentQuestion ||
        !canInteract ||
        showBossWarning ||
        gameResult !== "playing"
      ) {
        return;
      }

      const config = GAME_ITEMS_CONFIG[type];
      if (!config) return;

      const multiplier = isBossMode ? 2 : 1;
      const itemCost = config.cost * multiplier;

      // 1. BUFF THEO LƯỢT (Turn Buff: Khiên, Nhân Phẩm, ...)
      if (config.category === "turn_buff") {
        if (state.activeBuffs[type]) {
          toast.info(`${config.name} đã được kích hoạt cho câu hỏi này!`);
          return;
        }

        const validationError = config.validate?.({ gamification, stage });
        if (validationError) {
          toast.error(validationError);
          return;
        }

        // Tính tổng vàng cam kết của các bùa đang bật khác
        const currentCommittedCost = Object.entries(state.activeBuffs).reduce(
          (sum, [buffType, isActive]) => {
            if (!isActive || buffType === type) return sum;
            const buffConfig = GAME_ITEMS_CONFIG[buffType as ItemType];
            return sum + (buffConfig ? buffConfig.cost * multiplier : 0);
          },
          0
        );

        if (gold < itemCost + currentCommittedCost) {
          toast.error(`Không đủ vàng để mua ${config.name}!`);
          return;
        }

        dispatch({ type: "ACTIVATE_BUFF", item: type });
        toast.success(config.successMessage || `Đã kích hoạt ${config.name}!`);
        return;
      }

      // 2. VẬT PHẨM TỨC THỜI (Instant Items: Kính hiển vi, Đóng băng thời gian, ...)
      if (config.category === "instant") {
        if (gold < itemCost) {
          toast.error(`Không đủ vàng để sử dụng ${config.name}!`);
          return;
        }

        useItemMutation.mutate(
          {
            session_id: sessionId,
            item_name: config.apiItemName || type,
            question_id: currentQuestion.id,
          },
          {
            onSuccess: (data) => {
              toast.success(config.successMessage || `Đã sử dụng ${config.name}!`);
              if (data?.eliminated_option_ids) {
                dispatch({
                  type: "SET_HIDDEN_OPTIONS",
                  optionIds: data.eliminated_option_ids,
                });
              }
              if (config.apiItemName === "time_freeze") {
                onFreezeTimer();
              }
              if (data?.updated_gamification) {
                setGamification(data.updated_gamification);
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
      isBossMode,
      gold,
      state.activeBuffs,
      useItemMutation,
      sessionId,
      stage,
      onFreezeTimer,
      setGamification,
    ]
  );

  return {
    activeBuffs: state.activeBuffs,
    shieldActive: Boolean(state.activeBuffs.shield),
    doubleActive: Boolean(state.activeBuffs.double),
    setShieldActive: (active: boolean) => {
      if (active) dispatch({ type: "ACTIVATE_BUFF", item: "shield" });
    },
    setDoubleActive: (active: boolean) => {
      if (active) dispatch({ type: "ACTIVATE_BUFF", item: "double" });
    },
    hiddenOptions: state.hiddenOptions,
    setHiddenOptions: (optionIds: string[]) =>
      dispatch({ type: "SET_HIDDEN_OPTIONS", optionIds }),
    resetItemBuffs,
    handleUseItem,
  };
}

export type UseGameItemsReturn = ReturnType<typeof useGameItems>;
