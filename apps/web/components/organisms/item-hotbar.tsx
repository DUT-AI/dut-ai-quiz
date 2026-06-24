"use client";

import React from "react";
import { Microscope, Snowflake, Trophy, Shield, Lock } from "lucide-react";
import { motion } from "framer-motion";

export type ItemType = "50-50" | "freeze" | "double" | "shield";

interface ItemDef {
  type: ItemType;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  color: string; // Cartoon color styles
}

interface ItemHotbarProps {
  gold: number;
  onUseItem: (type: ItemType) => void;
  disabled: boolean; // lock hotbar during boss battles or alerts
  maxShieldLimitReached: boolean;
  isBossMode: boolean;
}

export default function ItemHotbar({
  gold,
  onUseItem,
  disabled,
  maxShieldLimitReached,
  isBossMode,
}: ItemHotbarProps) {
  const items: ItemDef[] = [
    {
      type: "50-50",
      name: "Kính Hiển Vi",
      description: "Loại bỏ 2 đáp án sai ngẫu nhiên",
      cost: 100,
      icon: <Microscope className="w-5 h-5" />,
      color: "text-cyan-500 border-zinc-900 bg-cyan-100 shadow-sm shadow-stone-800/10 hover:bg-cyan-200",
    },
    {
      type: "freeze",
      name: "Đóng Băng",
      description: "Ngừng thời gian đếm ngược suy nghĩ",
      cost: 150,
      icon: <Snowflake className="w-5 h-5" />,
      color: "text-blue-500 border-zinc-900 bg-blue-100 shadow-sm shadow-stone-800/10 hover:bg-blue-200",
    },
    {
      type: "double",
      name: "Nhân Phẩm",
      description: "Nhân đôi số điểm nhận được câu này",
      cost: 200,
      icon: <Trophy className="w-5 h-5" />,
      color: "text-amber-500 border-zinc-900 bg-amber-100 shadow-sm shadow-stone-800/10 hover:bg-amber-200",
    },
    {
      type: "shield",
      name: "Khiên Hộ Mệnh",
      description: "Bảo toàn sinh mệnh khi chọn sai (Max 1/Tầng)",
      cost: 250,
      icon: <Shield className="w-5 h-5" />,
      color: "text-emerald-500 border-zinc-900 bg-emerald-100 shadow-sm shadow-stone-800/10 hover:bg-emerald-200",
    },
  ];

  return (
    <div className="relative w-full py-3 px-4 bg-white border-3 border-zinc-900 rounded-none shadow-md shadow-stone-800/10 select-none text-zinc-900">
      {/* ─── LOCK / CHAIN OVERLAY WHEN DISABLED ─── */}
      {disabled && (
        <motion.div
          className="absolute inset-0 bg-zinc-900/90 flex items-center justify-center gap-3 z-30 font-mono text-sm text-red-500 font-bold tracking-wider border-2 border-red-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Lock className="w-4 h-4 text-red-500 animate-bounce" />
          <span>VẬT PHẨM BỊ KHÓA KHI ĐẤU BOSS / CẢNH BÁO</span>
        </motion.div>
      )}

      <div className="flex justify-between items-center text-sm font-mono text-zinc-700 mb-3 border-b-2 border-zinc-900 pb-1.5 font-bold">
        <span className="flex items-center gap-1.5">
          🎒 <span className="tracking-wide">QUẦY VẬT PHẨM HỖ TRỢ</span>
        </span>
        <span>
          Số dư: <span className="text-amber-600 font-extrabold text-base">🪙 {gold} Vàng</span>
        </span>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {items.map((item) => {
          const actualCost = item.cost * (isBossMode ? 2 : 1);
          const isAffordable = gold >= actualCost;
          const isShieldLimited = item.type === "shield" && maxShieldLimitReached;
          const canUse = isAffordable && !isShieldLimited;

          return (
            <div
              key={item.type}
              className="flex flex-col items-center border-2 border-zinc-900 p-2 rounded-none relative transition-all duration-300 bg-stone-50 group/item"
            >
              {/* Icon Container with Custom Tooltip */}
              <div className="relative flex items-center justify-center mb-2 mt-1">
                <div className={`p-2 border-2 rounded-none ${item.color.split(" ")[0]} ${item.color.split(" ")[1]} ${item.color.split(" ")[2]} cursor-help transition-all duration-300 ${
                  canUse ? "opacity-100" : "opacity-60 filter grayscale"
                }`}>
                  {item.icon}
                </div>

                {/* Tooltip Content */}
                <div className="absolute bottom-full mb-2.5 left-1/2 -translate-x-1/2 w-56 opacity-0 scale-90 translate-y-1 pointer-events-none group-hover/item:opacity-100 group-hover/item:scale-100 group-hover/item:translate-y-0 transition-all duration-200 ease-out flex flex-col bg-white border-2 border-zinc-900 p-2.5 shadow-sm shadow-stone-800/10 z-40 font-mono text-zinc-900 rounded-none">
                  {/* Arrow */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-zinc-900" />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-x-4 border-x-transparent border-t-4 border-t-white -mt-[2.5px]" />
                  
                  <span className="text-xs md:text-sm font-extrabold border-b border-zinc-200 pb-1 mb-1 text-zinc-900">{item.name}</span>
                  <span className="text-[11px] md:text-xs text-zinc-500 leading-normal font-medium">{item.description}</span>
                </div>
              </div>

              {/* Action Button */}
              <button
                type="button"
                disabled={!canUse}
                onClick={() => onUseItem(item.type)}
                className={`w-full py-1.5 text-xs font-mono font-bold tracking-wider rounded-none border-2 border-zinc-900 transition-all ${
                  canUse
                    ? "text-white bg-emerald-500 hover:bg-emerald-400 shadow-sm shadow-stone-800/10 active:translate-x-[0.5px] active:translate-y-[0.5px] active:shadow-none"
                    : "text-zinc-400 bg-zinc-100 cursor-not-allowed"
                }`}
              >
                🪙{actualCost}
              </button>

              {/* Shield Limit Overlay warning */}
              {isShieldLimited && (
                <div className="absolute inset-0 bg-white/95 flex items-center justify-center p-1 text-center text-xs font-mono text-red-500 font-extrabold border-2 border-red-500 font-bold leading-normal">
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
