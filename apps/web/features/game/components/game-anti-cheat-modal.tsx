"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, AlertTriangle } from "lucide-react";
import { VIOLATION_MESSAGES } from "@/hooks/use-anti-cheat";

export interface GameAntiCheatModalProps {
  isFullScreen: boolean;
  showViolationModal: boolean;
  violationType: string | null;
  violationCount: number;
  enterFullScreen: () => void;
  dismissViolation: () => void;
}

export default function GameAntiCheatModal({
  isFullScreen,
  showViolationModal,
  violationType,
  violationCount,
  enterFullScreen,
  dismissViolation,
}: GameAntiCheatModalProps) {
  return (
    <>
      {/* Fullscreen Requirement Overlay */}
      {!isFullScreen && (
        <div className="fixed inset-0 bg-white/95 dark:bg-black/95 backdrop-blur-xl flex items-center justify-center p-6 text-center z-[150] select-none">
          <div className="max-w-md space-y-8">
            <div className="size-20 rounded-3xl bg-primary/10 flex items-center justify-center mx-auto border border-primary/20">
              <Shield className="size-10 text-primary" />
            </div>
            <div className="space-y-4">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tighter">
                Yêu cầu Toàn màn hình
              </h2>
              <p className="text-zinc-650 dark:text-zinc-400 text-sm font-medium">
                Để đảm bảo tính công bằng của đấu trường, bạn cần chơi ở chế độ toàn màn hình.
              </p>
            </div>
            <button
              onClick={enterFullScreen}
              className="w-full py-4 bg-primary text-white rounded-2xl font-black text-base shadow-2xl shadow-primary/20 active:scale-95 transition-all"
            >
              VÀO CHẾ ĐỘ TOÀN MÀN HÌNH
            </button>
          </div>
        </div>
      )}

      {/* Violation Alert Modal */}
      <AnimatePresence>
        {showViolationModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/75 backdrop-blur-2xl"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-white dark:bg-zinc-900 rounded-[2.5rem] p-8 max-w-md w-full text-center space-y-6 shadow-2xl border border-red-500/20"
            >
              <div className="size-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
                <AlertTriangle className="size-8 text-red-500" />
              </div>
              <div className="space-y-2">
                <h2 className="text-xl font-black text-red-500 uppercase tracking-tighter">
                  PHÁT HIỆN VI PHẠM!
                </h2>
                <p className="text-zinc-900 dark:text-white font-bold text-xs bg-red-500/5 py-3 px-4 rounded-xl border border-red-500/10">
                  Lỗi: {violationType ? VIOLATION_MESSAGES[violationType] : "Phát hiện hành động bất thường."}
                </p>
                <p className="text-zinc-650 dark:text-zinc-400 text-[11px] leading-relaxed">
                  Hành động này vi phạm luật thi đấu. <br />
                  <span className="text-red-500 font-black underline italic">
                    Lưu ý: Nếu vi phạm lần thứ 3 ({violationCount}/3), bạn sẽ thất bại trận đấu ngay lập tức!
                  </span>
                </p>
              </div>
              <button
                onClick={dismissViolation}
                className="w-full py-4 bg-red-500 hover:bg-red-650 text-white rounded-[2rem] font-black text-sm shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                XÁC NHẬN VÀ QUAY LẠI
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
