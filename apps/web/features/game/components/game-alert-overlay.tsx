"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {showBossWarning && (
        <motion.div
          className="fixed inset-0 w-screen h-screen flex flex-col items-center justify-center text-center z-[9999] pointer-events-none select-none p-4"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.75)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          onAnimationComplete={() => {
            setTimeout(() => {
              onAnimationComplete();
            }, 2500);
          }}
        >
          {/* Pulsing Red Warning Banner Container */}
          <motion.div
            className="w-full max-w-2xl mx-auto py-10 px-8 flex flex-col items-center justify-center border-y-4"
            style={{
              backgroundColor: "rgba(69, 10, 10, 0.95)",
              borderColor: "#ef4444",
              boxShadow: "0 0 60px rgba(239, 68, 68, 0.6), inset 0 0 20px rgba(239, 68, 68, 0.2)",
            }}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: [0.8, 1.05, 1], opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <motion.div
              className="font-black text-6xl sm:text-7xl md:text-8xl font-mono tracking-widest animate-pulse"
              style={{
                color: "#ff3333",
                filter: "drop-shadow(0 0 20px #ef4444) drop-shadow(0 0 40px #dc2626)",
              }}
            >
              WARNING!
            </motion.div>
            <div
              className="font-extrabold mt-4 font-mono text-base sm:text-lg md:text-xl tracking-wide max-w-lg"
              style={{
                color: "#fef2f2",
                textShadow: "0 2px 4px rgba(0,0,0,0.9)",
              }}
            >
              BOSS <span style={{ color: "#fbbf24", fontWeight: 900 }}>{getBossName(stage)}</span> XUẤT HIỆN!
            </div>
            <div
              className="font-bold mt-2 font-mono text-xs sm:text-sm md:text-base tracking-wider uppercase"
              style={{
                color: "#fca5a5",
                textShadow: "0 1px 3px rgba(0,0,0,0.8)",
              }}
            >
              HP trừ gấp đôi nếu trả lời sai
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
