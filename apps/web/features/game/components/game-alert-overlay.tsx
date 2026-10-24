"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getBossName } from "../types";

export interface GameAlertOverlayProps {
  showBossWarning: boolean;
  stage: number;
  onAnimationComplete: () => void;
}

export default function GameAlertOverlay({
  showBossWarning,
  stage,
  onAnimationComplete,
}: GameAlertOverlayProps) {
  return (
    <AnimatePresence>
      {showBossWarning && (
        <motion.div
          className="absolute inset-0 bg-red-955/80 flex flex-col items-center justify-center text-center z-50 pointer-events-none select-none border-4 border-red-650/40"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 1, 0.8, 1, 0.9, 1] }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          onAnimationComplete={() => {
            setTimeout(() => {
              onAnimationComplete();
            }, 1200);
          }}
        >
          <motion.div
            className="text-red-500 font-extrabold text-5xl md:text-7xl font-mono tracking-widest animate-pulse"
            initial={{ scale: 0.5 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 120 }}
          >
            WARNING!
          </motion.div>
          <div className="text-zinc-100 font-extrabold mt-4 font-mono text-sm md:text-base max-w-sm px-4">
            BOSS {getBossName(stage)} XUẤT HIỆN. HP TRỪ GẤP ĐÔI NẾU TRẢ LỜI SAI!
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
