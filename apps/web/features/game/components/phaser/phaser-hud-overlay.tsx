"use client";

import React from "react";
import { motion } from "framer-motion";
import { Heart, Shield, Swords, Skull } from "lucide-react";

interface PhaserHudOverlayProps {
  stage: number;
  playerHp: number;
  playerMaxHp: number;
  bossHp: number;
  bossMaxHp: number;
  bossName: string;
}

export const PhaserHudOverlay: React.FC<PhaserHudOverlayProps> = ({
  stage,
  playerHp,
  playerMaxHp,
  bossHp,
  bossMaxHp,
  bossName,
}) => {
  // Convert bossHp to 5-heart scale like Game V1 if bossMaxHp > 5, or direct if maxHp <= 5
  const isScalePercentage = bossMaxHp > 5;
  const bossHeartCount = isScalePercentage ? 5 : bossMaxHp;
  const bossFilledHearts = isScalePercentage
    ? Math.ceil((Math.max(0, bossHp) / bossMaxHp) * bossHeartCount)
    : Math.max(0, bossHp);

  return (
    <div className="absolute top-2.5 left-0 right-0 px-3 md:px-5 flex items-center justify-between pointer-events-none z-20">
      {/* ─── 1. PLAYER STATS HUD (LEFT) ─── */}
      <div className="flex flex-col items-start bg-zinc-950/85 backdrop-blur-md border border-zinc-700/70 rounded-xl px-3 py-1.5 shadow-lg shadow-black/40">
        <div className="text-[10px] md:text-xs text-zinc-100 font-extrabold tracking-wider mb-1 flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-indigo-400 drop-shadow-[0_0_6px_rgba(129,140,248,0.8)]" />
          <span className="tracking-wide">HIỆP SĨ</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-1">
            {Array.from({ length: playerMaxHp }).map((_, index) => {
              const isFilled = index < playerHp;
              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={isFilled ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Heart
                    className={`w-4 h-4 md:w-[18px] md:h-[18px] transition-all duration-300 ${
                      isFilled
                        ? "text-red-500 fill-red-500 stroke-white stroke-[1.5]"
                        : "text-zinc-600 fill-zinc-900/80 stroke-zinc-700 stroke-1 opacity-40"
                    }`}
                    style={
                      isFilled
                        ? {
                            filter:
                              "drop-shadow(0 0 6px #ef4444) drop-shadow(0 0 12px #dc2626) drop-shadow(0 0 2px #ffffff)",
                          }
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </div>
          <span className="text-[11px] md:text-xs text-red-400 font-black font-mono tracking-tight drop-shadow-[0_0_6px_rgba(239,68,68,0.6)]">
            {playerHp}/{playerMaxHp}
          </span>
        </div>
      </div>

      {/* ─── 2. BOSS STATS HUD (RIGHT) ─── */}
      <div className="flex flex-col items-end bg-zinc-950/85 backdrop-blur-md border border-zinc-700/70 rounded-xl px-3 py-1.5 shadow-lg shadow-black/40">
        <div className="text-[10px] md:text-xs text-zinc-100 font-extrabold tracking-wider mb-1 flex items-center gap-1.5 justify-end">
          {stage === 3 ? (
            <Skull className="w-3.5 h-3.5 text-rose-400 drop-shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
          ) : (
            <Swords className="w-3.5 h-3.5 text-amber-400 drop-shadow-[0_0_6px_rgba(251,191,36,0.8)]" />
          )}
          <span className="uppercase tracking-wide">{bossName}</span>
        </div>
        <div className="flex items-center gap-2 justify-end">
          <span className="text-[11px] md:text-xs text-rose-400 font-black font-mono tracking-tight drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]">
            {bossHp}/{bossMaxHp}
          </span>
          <div className="flex gap-1 justify-end">
            {Array.from({ length: bossHeartCount }).map((_, index) => {
              const isFilled = index < bossFilledHearts;
              return (
                <motion.div
                  key={index}
                  initial={false}
                  animate={isFilled ? { scale: [1, 1.25, 1] } : { scale: 1 }}
                  transition={{ duration: 0.2 }}
                >
                  <Heart
                    className={`w-4 h-4 md:w-[18px] md:h-[18px] transition-all duration-300 ${
                      isFilled
                        ? "text-rose-500 fill-rose-500 stroke-white stroke-[1.5]"
                        : "text-zinc-600 fill-zinc-900/80 stroke-zinc-700 stroke-1 opacity-40"
                    }`}
                    style={
                      isFilled
                        ? {
                            filter:
                              "drop-shadow(0 0 6px #f43f5e) drop-shadow(0 0 12px #e11d48) drop-shadow(0 0 2px #ffffff)",
                          }
                        : undefined
                    }
                  />
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
