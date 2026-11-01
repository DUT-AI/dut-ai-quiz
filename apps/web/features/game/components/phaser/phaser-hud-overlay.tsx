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
      <div className="flex flex-col items-start bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 rounded-xl px-2.5 py-1.5 shadow-md">
        <div className="text-[10px] md:text-xs text-zinc-200 font-extrabold tracking-wider mb-1 flex items-center gap-1">
          <Shield className="w-3 h-3 text-indigo-400" />
          <span>HIỆP SĨ</span>
        </div>
        <div className="flex items-center gap-1.5">
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
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                      isFilled
                        ? "text-red-500 fill-red-500 stroke-zinc-950 stroke-2 filter drop-shadow-[0_1px_4px_rgba(239,68,68,0.95)]"
                        : "text-zinc-600 fill-zinc-900 stroke-zinc-700 stroke-1 opacity-50"
                    }`}
                  />
                </motion.div>
              );
            })}
          </div>
          <span className="text-[10px] md:text-xs text-red-500 font-extrabold font-mono ml-0.5">
            {playerHp}/{playerMaxHp}
          </span>
        </div>
      </div>

      {/* ─── 2. BOSS STATS HUD (RIGHT) ─── */}
      <div className="flex flex-col items-end bg-zinc-950/80 backdrop-blur-md border border-zinc-700/60 rounded-xl px-2.5 py-1.5 shadow-md">
        <div className="text-[10px] md:text-xs text-zinc-200 font-extrabold tracking-wider mb-1 flex items-center gap-1 justify-end">
          {stage === 3 ? (
            <Skull className="w-3.5 h-3.5 text-red-500" />
          ) : (
            <Swords className="w-3.5 h-3.5 text-red-500" />
          )}
          <span className="uppercase">{bossName}</span>
        </div>
        <div className="flex items-center gap-1.5 justify-end">
          <span className="text-[10px] md:text-xs text-red-500 font-extrabold font-mono mr-0.5">
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
                    className={`w-3.5 h-3.5 md:w-4 md:h-4 transition-all duration-300 ${
                      isFilled
                        ? "text-red-500 fill-red-500 stroke-zinc-950 stroke-2 filter drop-shadow-[0_1px_4px_rgba(239,68,68,0.95)]"
                        : "text-zinc-600 fill-zinc-900 stroke-zinc-700 stroke-1 opacity-50"
                    }`}
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
