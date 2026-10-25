import React from "react";
import { Microscope, Snowflake, Trophy, Shield } from "lucide-react";

import { type ItemType, type GamificationState } from "./types";

export type ItemCategory = "instant" | "turn_buff";

export interface ItemDef {
  type: ItemType;
  name: string;
  description: string;
  cost: number;
  category: ItemCategory;
  apiItemName?: string;
  icon: React.ReactNode;
  color: string;
  validate?: (context: { gamification: GamificationState; stage: number }) => string | null;
  successMessage?: string;
}

export const GAME_ITEMS: ItemDef[] = [
  {
    type: "50-50",
    name: "Kính Hiển Vi",
    description: "Loại bỏ 2 đáp án sai ngẫu nhiên",
    cost: 50,
    category: "instant",
    apiItemName: "microscope",
    icon: <Microscope className="w-4 h-4 md:w-5 md:h-5" />,
    color: "text-cyan-500 dark:text-cyan-400 border-zinc-900 dark:border-zinc-700 bg-cyan-50 dark:bg-cyan-950/40 shadow-sm hover:bg-cyan-100 dark:hover:bg-cyan-950/70",
    successMessage: "Đã dùng Kính Hiển Vi! 2 đáp án sai đã bị làm mờ.",
  },
  {
    type: "freeze",
    name: "Đóng Băng",
    description: "Ngừng thời gian đếm ngược và cộng thêm 30s",
    cost: 40,
    category: "instant",
    apiItemName: "time_freeze",
    icon: <Snowflake className="w-4 h-4 md:w-5 md:h-5" />,
    color: "text-blue-500 dark:text-blue-400 border-zinc-900 dark:border-zinc-700 bg-blue-50 dark:bg-blue-950/40 shadow-sm hover:bg-blue-100 dark:hover:bg-blue-950/70",
    successMessage: "Thời gian đã bị đóng băng! Bạn có thêm +30 giây.",
  },
  {
    type: "double",
    name: "Nhân Phẩm",
    description: "Nhân đôi số điểm nhận được câu này",
    cost: 100,
    category: "turn_buff",
    icon: <Trophy className="w-4 h-4 md:w-5 md:h-5" />,
    color: "text-amber-500 dark:text-amber-400 border-zinc-900 dark:border-zinc-700 bg-amber-50 dark:bg-amber-950/40 shadow-sm hover:bg-amber-100 dark:hover:bg-amber-950/70",
    successMessage: "Kích hoạt bùa Nhân Phẩm! Câu này sẽ được X2 điểm số.",
  },
  {
    type: "shield",
    name: "Khiên Hộ Mệnh",
    description: "Bảo toàn sinh mệnh khi chọn sai (Mỗi tầng tối đa 1)",
    cost: 80,
    category: "turn_buff",
    icon: <Shield className="w-4 h-4 md:w-5 md:h-5" />,
    color: "text-emerald-500 dark:text-emerald-400 border-zinc-900 dark:border-zinc-700 bg-emerald-50 dark:bg-emerald-950/40 shadow-sm hover:bg-emerald-100 dark:hover:bg-emerald-950/70",
    validate: ({ gamification, stage }) => {
      const shieldUsed = gamification.shield_used_in_tier?.[String(stage)] || false;
      if (shieldUsed) {
        return `Bạn đã sử dụng Khiên ở Tầng ${stage} rồi! Mỗi tầng chỉ được dùng 1 lần.`;
      }
      return null;
    },
    successMessage: "Khiên Hộ Mệnh đã dựng lên! Bảo toàn mạng nếu trả lời sai.",
  },
];

export const GAME_ITEMS_CONFIG: Record<ItemType, ItemDef> = GAME_ITEMS.reduce(
  (acc, item) => {
    acc[item.type] = item;
    return acc;
  },
  {} as Record<ItemType, ItemDef>
);
