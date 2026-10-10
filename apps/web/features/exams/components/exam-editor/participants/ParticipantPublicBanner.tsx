"use client";

import React from "react";
import { Globe, Lock, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

interface ParticipantPublicBannerProps {
  totalUsersCount: number;
  onSwitchToRestricted: () => void;
}

export function ParticipantPublicBanner({
  totalUsersCount,
  onSwitchToRestricted,
}: ParticipantPublicBannerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-8 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-primary/5 to-transparent border border-emerald-500/20 dark:border-emerald-500/10 text-center space-y-4"
    >
      <div className="size-14 mx-auto rounded-3xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-inner">
        <Globe className="size-7 animate-pulse" />
      </div>

      <div className="space-y-1.5 max-w-xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-black uppercase tracking-wider mb-1">
          <Sparkles className="size-3.5" />
          Chế độ mở công khai
        </div>
        <h4 className="text-xl font-bold text-dark-blue dark:text-white">
          Toàn bộ học sinh được phép làm bài
        </h4>
        <p className="text-sm text-gray-navy dark:text-light-blue/70">
          Bạn không cần chọn danh sách từng bạn. Toàn bộ học sinh có tài khoản trên hệ thống (~{totalUsersCount} tài khoản) sẽ tự động nhìn thấy bài thi này trong mục danh sách bài thi khi đến giờ mở.
        </p>
      </div>

      <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
        <button
          type="button"
          onClick={onSwitchToRestricted}
          className="px-5 py-2.5 rounded-2xl bg-white dark:bg-navy-blue border border-gray-200 dark:border-white/10 text-xs font-bold text-dark-blue dark:text-white hover:border-primary/50 hover:text-primary transition-all shadow-sm flex items-center gap-2 cursor-pointer"
        >
          <Lock className="size-3.5" />
          Chuyển sang chỉ định giới hạn cá nhân hoặc nhóm
        </button>
      </div>
    </motion.div>
  );
}
