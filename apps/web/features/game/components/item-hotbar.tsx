"use client";

import React from "react";
import { Lock } from "lucide-react";
import { motion } from "framer-motion";

import { type ItemType } from "../types";
import { GAME_ITEMS } from "../game-items.config";
export type { ItemType };

interface ItemHotbarProps {
  gold: number;
  onUseItem: (type: ItemType) => void;
  disabled: boolean; // lock hotbar during boss battles or alerts
  maxShieldLimitReached: boolean;
  isBossMode: boolean;
  activeBuffs?: Partial<Record<ItemType, boolean>>;
  doubleActive?: boolean;
  shieldActive?: boolean;
}

export default function ItemHotbar({
  gold,
  onUseItem,
  disabled,
  maxShieldLimitReached,
  isBossMode,
  activeBuffs,
  doubleActive,
  shieldActive,
}: ItemHotbarProps) {
  return (
    <div className="relative w-full py-3 px-3 md:px-4 bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 rounded-none shadow-md shadow-stone-800/10 dark:shadow-none select-none text-zinc-900 dark:text-zinc-100">
      {/* ─── LOCK / CHAIN OVERLAY WHEN DISABLED ─── */}
      {disabled && (
        <motion.div
          className="absolute inset-0 bg-zinc-900/90 dark:bg-zinc-950/95 flex items-center justify-center gap-2 z-30 font-mono text-xs md:text-sm text-red-500 dark:text-red-400 font-bold tracking-wider border-2 border-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Lock className="w-4 h-4 text-red-500 dark:text-red-400 animate-bounce" />
          <span>VẬT PHẨM KHÓA KHI ĐẤU BOSS / ALERTS</span>
        </motion.div>
      )}

      <div className="flex justify-between items-center text-xs md:text-sm font-mono text-zinc-700 dark:text-zinc-400 mb-3 border-b-2 border-zinc-900 dark:border-zinc-700 pb-1.5 font-bold">
        <span className="flex items-center gap-1.5">
          🎒 <span className="tracking-wide">QUẦY VẬT PHẨM HỖ TRỢ</span>
        </span>
        <span>
          Số dư: <span className="text-amber-600 dark:text-amber-400 font-extrabold text-sm md:text-base">🪙 {gold} Vàng</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {GAME_ITEMS.map((item) => {
          const isItemActive = Boolean(
            activeBuffs?.[item.type] ??
            (item.type === "double" ? doubleActive : item.type === "shield" ? shieldActive : false)
          );
          const actualCost = item.cost * (isBossMode ? 2 : 1);
          const isAffordable = gold >= actualCost;
          const isShieldLimited = item.type === "shield" && maxShieldLimitReached && !isItemActive;
          const canUse = isItemActive || (isAffordable && !isShieldLimited);

          return (
            <div
              key={item.type}
              className={`flex flex-col items-center border-2 border-zinc-900 dark:border-zinc-700 p-1.5 md:p-2 rounded-none relative transition-all duration-300 bg-stone-50 dark:bg-zinc-950 group/item ${
                isItemActive ? "ring-2 ring-amber-400 dark:ring-amber-500" : ""
              }`}
            >
              {/* Icon Container with Custom Tooltip */}
              <div className="relative flex items-center justify-center mb-2 mt-1">
                <div
                  className={`p-1.5 md:p-2 border-2 rounded-none ${item.color.split(" ")[0]} ${item.color.split(" ")[1]} ${item.color.split(" ")[2]} cursor-help transition-all duration-300 ${
                    canUse ? "opacity-100" : "opacity-60 filter grayscale"
                  }`}
                >
                  {item.icon}
                </div>

                {/* Tooltip Content */}
                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-48 md:w-56 opacity-0 scale-90 translate-y-1 pointer-events-none group-hover/item:opacity-100 group-hover/item:scale-100 group-hover/item:translate-y-0 transition-all duration-200 ease-out flex flex-col bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 p-2 md:p-2.5 shadow-md font-mono text-zinc-900 dark:text-zinc-100 z-40 rounded-none">
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-zinc-900 dark:border-t-zinc-700" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white dark:border-t-zinc-800 -mt-[2.5px]" />

                  <span className="text-[11px] md:text-sm font-extrabold border-b border-zinc-200 dark:border-zinc-700 pb-1 mb-1">
                    {item.name}
                  </span>
                  <span className="text-[10px] md:text-xs text-zinc-500 dark:text-zinc-400 leading-normal font-medium">
                    {item.description}
                  </span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!canUse || isItemActive}
                onClick={() => onUseItem(item.type)}
                className={`w-full py-1 text-[10px] md:text-xs font-mono font-bold tracking-wider rounded-none border-2 border-zinc-900 dark:border-zinc-700 transition-all ${
                  isItemActive
                    ? "text-white bg-amber-500 dark:bg-amber-600 shadow-sm cursor-default"
                    : canUse
                    ? "text-white bg-emerald-500 hover:bg-emerald-400 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-sm active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                    : "text-zinc-400 dark:text-zinc-500 bg-zinc-150 dark:bg-zinc-800 cursor-not-allowed"
                }`}
              >
                {isItemActive ? "ĐÃ BẬT" : `🪙${actualCost}`}
              </button>

              {/* Shield Limit Overlay warning */}
              {isShieldLimited && (
                <div className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 flex items-center justify-center p-1 text-center text-[10px] md:text-xs font-mono text-red-500 dark:text-red-400 font-extrabold border-2 border-red-500 dark:border-red-600 leading-normal z-10">
                  ĐÃ DÙNG
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
