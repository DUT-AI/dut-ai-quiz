"use client";

import React from "react";
import { HelpCircle, Heart, Shield, Swords, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export function GameTabRules() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
  };

  // Micro-animations for the icons inside rules cards
  const heartIconVariants = {
    hover: {
      scale: [1, 1.25, 1.1, 1.25, 1],
      transition: {
        duration: 0.8,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const shieldIconVariants = {
    hover: {
      rotate: [0, -10, 10, -10, 10, 0],
      transition: {
        duration: 0.6,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const swordsIconVariants = {
    hover: {
      x: [-2, 2, -2, 2, 0],
      y: [-2, 2, -2, 2, 0],
      rotate: [0, -5, 5, -5, 0],
      transition: {
        duration: 0.5,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

  const sparklesIconVariants = {
    hover: {
      scale: [1, 1.15, 1],
      rotate: [0, 90, 180, 270, 360],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "linear",
      },
    },
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Section Title */}
      <h4 className="text-lg font-bold text-dark-blue dark:text-white flex items-center gap-2 border-b border-gray-150/80 dark:border-white/10 pb-3 mb-2">
        <HelpCircle className="w-5 h-5 text-indigo-500" />
        Luật Chơi Đấu Trường
      </h4>

      {/* Rules Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-2 gap-4"
      >
        {/* Rule 1: HP */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="group flex gap-4 items-start bg-white/50 dark:bg-[#1E2A3A]/20 p-5 rounded-2xl border border-gray-150/80 dark:border-white/5 hover:border-rose-500/40 dark:hover:border-rose-500/30 hover:bg-gradient-to-br hover:from-white hover:to-rose-50/30 dark:hover:from-[#1E2A3A]/30 dark:hover:to-rose-950/10 hover:shadow-lg hover:shadow-rose-500/5 dark:hover:shadow-rose-950/15 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="p-3 bg-rose-500/10 dark:bg-rose-500/10 rounded-xl border border-rose-500/20 group-hover:bg-rose-500/20 group-hover:border-rose-500/40 transition-colors duration-300">
            <motion.div variants={heartIconVariants}>
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500/10 dark:fill-rose-500/25" />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-black text-dark-blue dark:text-white mb-1.5 transition-colors group-hover:text-rose-500">
              Mạng sống (HP)
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/90 leading-relaxed font-medium">
              Mỗi lượt chơi bắt đầu với <span className="text-rose-500 font-extrabold">3 HP</span>. Trả lời sai sẽ bị trừ HP.
            </p>
          </div>
        </motion.div>

        {/* Rule 2: Challenge Tier */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="group flex gap-4 items-start bg-white/50 dark:bg-[#1E2A3A]/20 p-5 rounded-2xl border border-gray-150/80 dark:border-white/5 hover:border-emerald-500/40 dark:hover:border-emerald-500/30 hover:bg-gradient-to-br hover:from-white hover:to-emerald-50/30 dark:hover:from-[#1E2A3A]/30 dark:hover:to-emerald-950/10 hover:shadow-lg hover:shadow-emerald-500/5 dark:hover:shadow-emerald-950/15 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="p-3 bg-emerald-500/10 dark:bg-emerald-500/10 rounded-xl border border-emerald-500/20 group-hover:bg-emerald-500/20 group-hover:border-emerald-500/40 transition-colors duration-300">
            <motion.div variants={shieldIconVariants}>
              <Shield className="w-5 h-5 text-emerald-500 fill-emerald-500/10 dark:fill-emerald-500/25" />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-black text-dark-blue dark:text-white mb-1.5 transition-colors group-hover:text-emerald-500">
              Tầng Thử Thách
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/90 leading-relaxed font-medium">
              Leo tháp qua 3 tầng: <span className="text-emerald-500 font-extrabold">Dễ</span> (T1), <span className="text-amber-500 font-extrabold">Vừa</span> (T2), và <span className="text-rose-500 font-extrabold">Khó</span> (T3).
            </p>
          </div>
        </motion.div>

        {/* Rule 3: Boss */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="group flex gap-4 items-start bg-white/50 dark:bg-[#1E2A3A]/20 p-5 rounded-2xl border border-gray-150/80 dark:border-white/5 hover:border-amber-500/40 dark:hover:border-amber-500/30 hover:bg-gradient-to-br hover:from-white hover:to-amber-50/30 dark:hover:from-[#1E2A3A]/30 dark:hover:to-amber-950/10 hover:shadow-lg hover:shadow-amber-500/5 dark:hover:shadow-amber-950/15 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="p-3 bg-amber-500/10 dark:bg-amber-500/10 rounded-xl border border-amber-500/20 group-hover:bg-amber-500/20 group-hover:border-amber-500/40 transition-colors duration-300">
            <motion.div variants={swordsIconVariants}>
              <Swords className="w-5 h-5 text-amber-500" />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-black text-dark-blue dark:text-white mb-1.5 transition-colors group-hover:text-amber-500">
              BOSS Canh Giữ
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/90 leading-relaxed font-medium">
              Chiến Boss cuối mỗi tầng. Sai trừ <span className="text-rose-500 font-extrabold">2 HP</span>, thời gian rút ngắn còn <span className="text-amber-500 font-extrabold">10 giây</span>.
            </p>
          </div>
        </motion.div>

        {/* Rule 4: Healing & Items */}
        <motion.div
          variants={cardVariants}
          whileHover="hover"
          className="group flex gap-4 items-start bg-white/50 dark:bg-[#1E2A3A]/20 p-5 rounded-2xl border border-gray-150/80 dark:border-white/5 hover:border-teal-500/40 dark:hover:border-teal-500/30 hover:bg-gradient-to-br hover:from-white hover:to-teal-50/30 dark:hover:from-[#1E2A3A]/30 dark:hover:to-teal-950/10 hover:shadow-lg hover:shadow-teal-500/5 dark:hover:shadow-teal-950/15 transition-all duration-300 backdrop-blur-sm"
        >
          <div className="p-3 bg-teal-500/10 dark:bg-teal-500/10 rounded-xl border border-teal-500/20 group-hover:bg-teal-500/20 group-hover:border-teal-500/40 transition-colors duration-300">
            <motion.div variants={sparklesIconVariants}>
              <Sparkles className="w-5 h-5 text-teal-500" />
            </motion.div>
          </div>
          <div>
            <p className="text-sm font-black text-dark-blue dark:text-white mb-1.5 transition-colors group-hover:text-teal-500">
              Hồi phục & Vật phẩm
            </p>
            <p className="text-xs text-gray-navy dark:text-light-blue/90 leading-relaxed font-medium">
              Diệt Boss hồi <span className="text-teal-500 font-extrabold">+2 HP</span>. Tích luỹ Vàng từ câu trả lời đúng để mua vật phẩm hỗ trợ.
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
