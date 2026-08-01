"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Swords, Play, RotateCcw, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { useStartGameSession } from "@/features/game/queries";

interface GameTabHeroProps {
  slug: string;
  activeSession: any;
  isLoadingSession: boolean;
}

export function GameTabHero({ slug, activeSession, isLoadingSession }: GameTabHeroProps) {
  const router = useRouter();
  const startSessionMutation = useStartGameSession();
  const [isGameLoading, setIsGameLoading] = useState(false);

  const hasActiveSession = !!activeSession?.session_id;
  const completedCount = activeSession?.snapshot?.gamification?.last_question_index ?? 0;
  const totalCount = activeSession?.snapshot?.questions?.length ?? 0;

  const handleStartNewSession = () => {
    if (startSessionMutation.isPending || isGameLoading) return;
    setIsGameLoading(true);
    startSessionMutation.mutate(
      { lesson_slug: slug },
      {
        onSuccess: () => {
          router.push(`/lessons/${slug}/game`);
        },
        onError: () => {
          setIsGameLoading(false);
        },
      }
    );
  };


  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  const swordVariants = {
    hover: {
      rotate: [0, -10, 10, -10, 10, 0],
      scale: 1.1,
      transition: { duration: 0.5 },
    },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="relative flex flex-col md:flex-row md:items-center justify-between gap-8 border-b border-gray-150/80 dark:border-white/10 pb-8 overflow-hidden group"
    >
      {/* Decorative Radiance Glow behind the swords icon */}
      <div className="absolute right-0 bottom-0 w-80 h-80 bg-gradient-to-tr from-indigo-500/10 to-purple-500/5 blur-3xl rounded-full -mr-16 -mb-16 pointer-events-none group-hover:from-indigo-500/20 transition-all duration-700" />

      {/* Background large Swords icon decoration */}
      <div className="absolute right-6 bottom-0 opacity-5 dark:opacity-10 translate-x-8 translate-y-8 transition-transform duration-700 ease-out group-hover:scale-110 group-hover:-rotate-12 pointer-events-none">
        <Swords className="size-56 text-indigo-500" />
      </div>

      <div className="relative z-10 flex-1 flex flex-col gap-4">
        {/* RPG Game Mode Tag */}
        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 self-start"
        >
          <div className="size-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-400/10 flex items-center justify-center text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 shadow-inner">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            >
              <Swords className="size-5" />
            </motion.div>
          </div>
          <span className="text-xs font-black tracking-widest bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 bg-clip-text text-transparent uppercase">
            CHẾ ĐỘ CHƠI ĐỐI KHÁNG RPG
          </span>
        </motion.div>

        {/* Hero Title */}
        <motion.h3
          variants={itemVariants}
          className="text-3xl md:text-4xl font-extrabold tracking-tight"
        >
          <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 dark:from-indigo-400 dark:via-purple-400 dark:to-pink-400 bg-clip-text text-transparent font-black drop-shadow-sm">
            Đấu Trường Luyện Tập
          </span>
        </motion.h3>

        {/* Hero Description */}
        <motion.p
          variants={itemVariants}
          className="text-gray-navy dark:text-light-blue/80 text-sm md:text-base leading-relaxed max-w-2xl font-medium"
        >
          Cạnh tranh bảng xếp hạng với các học viên khác bằng cách trả lời nhanh các câu hỏi trắc nghiệm kiến thức. Thu thập vàng thưởng và sử dụng các bảo vật phép thuật như{" "}
          <span className="text-indigo-600 dark:text-indigo-400 font-bold">Khiên Hộ Mệnh</span>{" "}
          hay{" "}
          <span className="text-purple-600 dark:text-purple-400 font-bold">Bùa Nhân Phẩm</span>{" "}
          để vượt qua các Boss canh giữ nguy hiểm!
        </motion.p>
      </div>

      {/* Actions Section */}
      <motion.div
        variants={itemVariants}
        className="relative z-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 min-w-[280px]"
      >
        {isLoadingSession ? (
          <div className="h-14 w-full bg-gray-100 dark:bg-zinc-800 animate-pulse rounded-full border border-gray-200 dark:border-white/5" />
        ) : isGameLoading ? (
          <Button
            disabled
            className="w-full py-6 px-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black shadow-xl opacity-75 cursor-wait text-sm flex items-center justify-center gap-2"
          >
            <Loader2 className="size-4 animate-spin text-white" />
            <span>Đang chuẩn bị đấu trường...</span>
          </Button>
        ) : hasActiveSession ? (
          <div className="flex flex-col sm:flex-row gap-3 w-full">
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                onClick={() => {
                  setIsGameLoading(true);
                  router.push(`/lessons/${slug}/game?action=continue`);
                }}
                disabled={isGameLoading || startSessionMutation.isPending}
                className="w-full py-6 px-6 rounded-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-black shadow-lg shadow-emerald-500/20 dark:shadow-emerald-950/20 border-b-4 border-emerald-700 hover:border-emerald-800 transition-all text-sm flex items-center justify-center gap-2 group/btn"
              >
                {isGameLoading ? (
                  <Loader2 className="size-4 animate-spin text-white" />
                ) : (
                  <motion.div
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <Play className="size-4 fill-current text-white" />
                  </motion.div>
                )}
                <span>
                  Tiếp tục đấu ({completedCount}/{totalCount})
                </span>
              </Button>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1"
            >
              <Button
                variant="outline"
                onClick={handleStartNewSession}
                disabled={isGameLoading || startSessionMutation.isPending}
                className="w-full py-6 px-6 rounded-full border-2 border-gray-200 dark:border-white/10 text-dark-blue dark:text-white font-bold hover:bg-gray-50 dark:hover:bg-white/5 shadow-sm transition-all text-sm flex items-center justify-center gap-2"
              >
                {isGameLoading || startSessionMutation.isPending ? (
                  <Loader2 className="size-4 animate-spin text-gray-500 dark:text-gray-400" />
                ) : (
                  <RotateCcw className="size-4 text-gray-500 dark:text-gray-400 group-hover:rotate-185 transition-transform duration-300" />
                )}
                <span>Bắt đầu ván mới</span>
              </Button>
            </motion.div>
          </div>
        ) : (
          <motion.div
            whileHover="hover"
            whileTap={{ scale: 0.98 }}
            className="w-full"
          >
            <Button
              onClick={handleStartNewSession}
              disabled={isGameLoading || startSessionMutation.isPending}
              className="w-full py-6 px-10 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white font-black shadow-xl shadow-indigo-500/25 dark:shadow-indigo-950/30 hover:brightness-105 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
            >
              {isGameLoading || startSessionMutation.isPending ? (
                <Loader2 className="size-4 animate-spin text-white" />
              ) : (
                <motion.div variants={swordVariants} className="flex items-center">
                  <Swords className="size-4 mr-1 text-white" />
                </motion.div>
              )}
              <span>Vào Đấu Trường Ngay</span>
            </Button>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
