"use client";

import React from "react";
import { Microscope, ShieldAlert, Snowflake, Trophy, Lock } from "lucide-react";
import { motion } from "framer-motion";

export type ItemType = "50-50" | "freeze" | "double" | "shield";

interface ItemDef {
  type: ItemType;
  name: string;
  description: string;
  cost: number;
  icon: React.ReactNode;
  color: string; // Tailwind neon color classes
}

interface ItemHotbarProps {
  gold: number;
  ownedItems: Record<ItemType, number>;
  onPurchase: (type: ItemType) => void;
  onUseItem: (type: ItemType) => void;
  disabled: boolean; // lock hotbar during boss battles or alerts
  maxShieldLimitReached: boolean;
}

export default function ItemHotbar({
  gold,
  ownedItems,
  onPurchase,
  onUseItem,
  disabled,
  maxShieldLimitReached,
}: ItemHotbarProps) {
  const items: ItemDef[] = [
    {
      type: "50-50",
      name: "Kính Hiển Vi",
      description: "Loại bỏ 2 đáp án sai",
      cost: 100,
      icon: <Microscope className="w-5 h-5" />,
      color: "text-cyan-400 border-cyan-500/30 bg-cyan-950/20 hover:border-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)] hover:shadow-[0_0_15px_rgba(34,211,238,0.35)]",
    },
    {
      type: "freeze",
      name: "Đóng Băng",
      description: "Ngừng thời gian đếm ngược",
      cost: 150,
      icon: <Snowflake className="w-5 h-5" />,
      color: "text-sky-400 border-sky-500/30 bg-sky-950/20 hover:border-sky-400 shadow-[0_0_10px_rgba(56,189,248,0.1)] hover:shadow-[0_0_15px_rgba(56,189,248,0.35)]",
    },
    {
      type: "double",
      name: "Nhân Phẩm",
      description: "Nhân đôi điểm số câu này",
      cost: 200,
      icon: <Trophy className="w-5 h-5" />,
      color: "text-yellow-400 border-yellow-500/30 bg-yellow-950/20 hover:border-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.1)] hover:shadow-[0_0_15px_rgba(234,179,8,0.35)]",
    },
    {
      type: "shield",
      name: "Khiên Hộ Mệnh",
      description: "Bảo toàn mạng khi chọn sai (Max 1/Tầng)",
      cost: 250,
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "text-emerald-400 border-emerald-500/30 bg-emerald-950/20 hover:border-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.1)] hover:shadow-[0_0_15px_rgba(52,211,153,0.35)]",
    },
  ];

  return (
    <div className="relative w-full max-w-4xl mx-auto py-2 px-4 bg-zinc-950 border border-zinc-800 rounded-none shadow-2xl overflow-hidden select-none">
      {/* ─── LOCK / CHAIN OVERLAY WHEN DISABLED ─── */}
      {disabled && (
        <motion.div
          className="absolute inset-0 bg-black/80 flex items-center justify-center gap-3 z-30 font-mono text-xs text-red-500 font-bold tracking-wider"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <Lock className="w-4 h-4 text-red-500 animate-bounce" />
          <span>VẬT PHẨM BỊ KHÓA TRONG TRẬN ĐẤU BOSS / CẢNH BÁO</span>
        </motion.div>
      )}

      <div className="flex justify-between items-center text-xs font-mono text-zinc-400 mb-3 border-b border-zinc-800 pb-1.5">
        <span className="flex items-center gap-1.5">
          ⚔️ <span className="font-bold tracking-wide">QUẦY VẬT PHẨM HỖ TRỢ CHIẾN ĐẤU</span>
        </span>
        <span>
          Số dư: <span className="text-yellow-400 font-bold">🪙 {gold} Vàng</span>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {items.map((item) => {
          const isAffordable = gold >= item.cost;
          const isShieldLimited = item.type === "shield" && maxShieldLimitReached;
          const count = ownedItems[item.type];
          
          // Disable purchase if not affordable or shield limit reached
          const canPurchase = isAffordable && !isShieldLimited;

          return (
            <div
              key={item.type}
              className={`flex flex-col border p-3 rounded-none relative transition-all duration-300 bg-zinc-900/60 ${
                canPurchase ? "border-zinc-800" : "border-zinc-950 opacity-60 filter grayscale"
              }`}
            >
              {/* Owned Count Badge */}
              {count > 0 && (
                <div className="absolute -top-2 -right-2 bg-red-600 text-white font-extrabold font-mono text-[10px] w-5 h-5 flex items-center justify-center rounded-none border border-red-400 animate-pulse z-10 shadow-[0_0_8px_rgba(220,38,38,0.5)]">
                  x{count}
                </div>
              )}

              {/* Item Info Header */}
              <div className="flex gap-2.5 items-center mb-1">
                <div className={`p-1.5 border rounded-none ${item.color.split(" ")[0]} ${item.color.split(" ")[1]}`}>
                  {item.icon}
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white font-mono">{item.name}</span>
                  <span className="text-[9px] text-zinc-500 leading-tight font-mono">{item.description}</span>
                </div>
              </div>

              {/* Action Buttons Grid */}
              <div className="grid grid-cols-2 gap-2 mt-auto.5 pt-2 border-t border-zinc-800/40">
                {/* 1. Mua vật phẩm (Buy Button) */}
                <button
                  type="button"
                  disabled={!canPurchase}
                  onClick={() => onPurchase(item.type)}
                  className={`w-full py-1 text-[10px] font-mono font-bold tracking-wider rounded-none border transition-all ${
                    canPurchase
                      ? "text-yellow-400 bg-yellow-950/20 border-yellow-500/40 hover:border-yellow-400 active:scale-95"
                      : "text-zinc-600 border-zinc-900 bg-zinc-950/40 cursor-not-allowed"
                  }`}
                >
                  MUA 🪙{item.cost}
                </button>

                {/* 2. Sử dụng vật phẩm (Use Button) */}
                <button
                  type="button"
                  disabled={count <= 0}
                  onClick={() => onUseItem(item.type)}
                  className={`w-full py-1 text-[10px] font-mono font-bold tracking-wider rounded-none border transition-all ${
                    count > 0
                      ? "text-emerald-400 bg-emerald-950/20 border-emerald-500/40 hover:border-emerald-400 active:scale-95 shadow-[0_0_5px_rgba(16,185,129,0.15)]"
                      : "text-zinc-600 border-zinc-900 bg-zinc-950/40 cursor-not-allowed"
                  }`}
                >
                  SỬ DỤNG
                </button>
              </div>

              {/* Shield Limit Overlay warning */}
              {isShieldLimited && (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center p-2 text-center text-[10px] font-mono text-emerald-400 font-bold leading-tight">
                  KHIÊN CHỈ MUA 1 CÁI / ẢI TẦNG
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
