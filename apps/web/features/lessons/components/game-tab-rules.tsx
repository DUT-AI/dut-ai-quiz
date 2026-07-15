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

  const nodeVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "backOut" } },
  };

  const heartIconVariants = {
    hover: {
      scale: [1, 1.25, 1, 1.25, 1],
      transition: { duration: 0.8, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const shieldIconVariants = {
    hover: {
      y: [-2, 2, -2],
      transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const swordsIconVariants = {
    hover: {
      rotate: [0, -15, 15, -15, 0],
      transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" },
    },
  };

  const sparklesIconVariants = {
    hover: {
      scale: [1, 1.2, 1],
      rotate: [0, 90, 180, 270, 360],
      transition: { duration: 2, repeat: Infinity, ease: "linear" },
    },
  };

  const rules = [
    {
      num: "01",
      title: "Mạng Sống (HP)",
      desc: "Mỗi lượt chơi bắt đầu với 3 HP. Trả lời sai bị trừ HP.",
      highlight: "3 HP",
      highlightColor: "text-rose-500 font-extrabold",
      icon: Heart,
      colorClass: "rose",
      themeColor: "from-rose-500 to-red-600",
      glowColor: "rgba(244,63,94,0.15)",
      bgIcon: "bg-rose-500/10 text-rose-500 border-rose-500/20",
      iconAnimation: heartIconVariants,
    },
    {
      num: "02",
      title: "Tầng Thử Thách",
      desc: "Leo tháp qua 3 tầng: Dễ (T1), Vừa (T2), và Khó (T3).",
      highlight: "3 tầng",
      highlightColor: "text-emerald-500 font-extrabold",
      icon: Shield,
      colorClass: "emerald",
      themeColor: "from-emerald-500 to-teal-600",
      glowColor: "rgba(16,185,129,0.15)",
      bgIcon: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
      iconAnimation: shieldIconVariants,
    },
    {
      num: "03",
      title: "BOSS Canh Giữ",
      desc: "Chiến Boss cuối mỗi tầng. Sai trừ 2 HP, thời gian rút ngắn còn 10 giây.",
      highlight: "2 HP",
      highlightColor: "text-amber-500 font-extrabold",
      icon: Swords,
      colorClass: "amber",
      themeColor: "from-amber-500 to-orange-600",
      glowColor: "rgba(245,158,11,0.15)",
      bgIcon: "bg-amber-500/10 text-amber-500 border-amber-500/20",
      iconAnimation: swordsIconVariants,
    },
    {
      num: "04",
      title: "Hồi Phục & Vật Phẩm",
      desc: "Diệt Boss hồi +2 HP. Tích luỹ Vàng từ câu trả lời đúng để mua vật phẩm hỗ trợ.",
      highlight: "+2 HP",
      highlightColor: "text-cyan-500 font-extrabold",
      icon: Sparkles,
      colorClass: "cyan",
      themeColor: "from-cyan-500 to-blue-600",
      glowColor: "rgba(6,182,212,0.15)",
      bgIcon: "bg-cyan-500/10 text-cyan-500 border-cyan-500/20",
      iconAnimation: sparklesIconVariants,
    },
  ];

  return (
    <div className="w-full relative py-4">
      {/* Title with tech line */}
      <div className="flex items-center gap-3 mb-8 relative z-10">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 rounded-full text-xs font-black tracking-wider text-indigo-600 dark:text-indigo-400 uppercase">
          <HelpCircle className="w-3.5 h-3.5" />
          <span>LUẬT CHƠI ĐẤU TRƯỜNG</span>
        </div>
        <div className="flex-1 h-[1px] bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent" />
      </div>

      {/* Interactive Quest Map Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-4 gap-6 relative z-10"
      >
        {rules.map((rule, idx) => {
          const IconComponent = rule.icon;
          return (
            <motion.div
              key={idx}
              variants={nodeVariants}
              whileHover="hover"
              className="relative group flex flex-col items-stretch"
            >
              {/* Connection Line (Desktop) */}
              {idx < 3 && (
                <div className="absolute top-[26px] left-[70%] w-full h-[2px] bg-gradient-to-r from-indigo-500/20 via-purple-500/10 to-transparent hidden md:block pointer-events-none -z-10" />
              )}

              {/* Card Node wrapper */}
              <div className="flex-1 flex flex-col p-5 bg-[#fafafa]/80 dark:bg-[#121b2e]/40 border border-gray-200/50 dark:border-white/5 rounded-3xl transition-all duration-300 relative overflow-hidden group-hover:-translate-y-1.5 group-hover:border-indigo-500/30 group-hover:bg-white dark:group-hover:bg-[#1E2A3A]/30 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)] group-hover:shadow-[0_12px_24px_-8px_rgba(99,102,241,0.12)]">
                {/* Tech corner notch */}
                <div className="absolute top-0 right-0 w-8 h-8 pointer-events-none overflow-hidden">
                  <div className="absolute top-[-10px] right-[-10px] w-6 h-6 rotate-45 bg-gray-200/50 dark:bg-zinc-800 transition-colors group-hover:bg-indigo-500/20" />
                </div>

                <div className="flex items-start gap-4 mb-3">
                  {/* Hexagon/Circle Tech Icon Box */}
                  <div className={`size-12 rounded-2xl flex items-center justify-center border transition-all duration-300 ${rule.bgIcon} group-hover:scale-105 group-hover:shadow-md shadow-inner`}>
                    <motion.div variants={rule.iconAnimation}>
                      <IconComponent className="size-5" />
                    </motion.div>
                  </div>

                  <div>
                    <span className="text-[10px] font-black text-gray-400 dark:text-zinc-500 tracking-widest font-mono">
                      PHASE {rule.num}
                    </span>
                    <h5 className="text-sm font-black text-dark-blue dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors mt-0.5">
                      {rule.title}
                    </h5>
                  </div>
                </div>

                {/* Desc */}
                <p className="text-xs text-gray-navy dark:text-light-blue/80 leading-relaxed font-semibold flex-1">
                  {rule.desc.split(rule.highlight)[0]}
                  <span className={rule.highlightColor}>{rule.highlight}</span>
                  {rule.desc.split(rule.highlight)[1]}
                </p>

                {/* Bottom decorative bar with color indicator */}
                <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${rule.themeColor} opacity-20 group-hover:opacity-100 transition-opacity duration-300`} />
              </div>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
