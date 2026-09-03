"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Skull, Swords, Heart } from "lucide-react";
import dynamic from "next/dynamic";
import CircularTimer from "./circular-timer";

interface BossHudProps {
  status: "idle" | "attack" | "damage" | "defeat"; // Enemy status
  playerStatus: "idle" | "attack" | "damage"; // Player status
  hp: number; // Enemy current HP
  maxHp: number; // Enemy max HP
  name: string; // Enemy Name
  level: number; // Enemy Level
  playerHp: number; // Player current HP
  playerMaxHp: number; // Player max HP
  monsterType: "slime" | "spider" | "bat" | "golem" | "eye";
  playerLvl: number; // Player character level (1 to 4)
  // Timer props
  timerMax: number;
  timerFrozen: boolean;
  isAnswered: boolean;
  questionId: string;
  timeLeftRef: React.MutableRefObject<number>;
  onTimeOut: () => void;
}

// Client-only Rive Player to avoid Next.js SSR document/window issues
const RivePlayer = dynamic(
  () => import("@/components/molecules/rive-player"),
  { ssr: false }
);

const getMonsterBgClass = (type: "slime" | "spider" | "bat" | "golem" | "eye") => {
  switch (type) {
    case "slime":
      return "bg-[linear-gradient(to_bottom,#7dd3fc_0%,#bae6fd_55%,#86efac_55%,#4ade80_100%)] dark:bg-[linear-gradient(to_bottom,#0c4a6e_0%,#075985_55%,#065f46_55%,#064e3b_100%)]";
    case "spider":
    case "golem":
      return "bg-[linear-gradient(to_bottom,#0f172a_0%,#1e293b_55%,#166534_55%,#15803d_100%)] dark:bg-[linear-gradient(to_bottom,#020617_0%,#0f172a_55%,#14532d_55%,#052e16_100%)]";
    case "bat":
    case "eye":
    default:
      return "bg-[linear-gradient(to_bottom,#2d0606_0%,#450a0a_55%,#991b1b_55%,#dc2626_100%)] dark:bg-[linear-gradient(to_bottom,#180202_0%,#2c0c0c_55%,#5c1d1d_55%,#450a0a_100%)]";
  }
};

const renderMonsterSvg = (type: "slime" | "spider" | "bat" | "golem" | "eye", status: string) => {
  const svgClasses = "w-24 h-24 md:w-32 md:h-32 lg:w-40 lg:h-40 relative z-10 select-none pointer-events-none";
  switch (type) {
    case "slime":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClasses}
        >
          {/* Green Slime */}
          <motion.path
            d="M30 85 C20 85, 15 55, 40 48 C45 34, 75 34, 80 48 C105 55, 100 85, 90 85 Z"
            fill="#10b981"
            stroke="#1e293b"
            strokeWidth="3.5"
            animate={status === "damage" ? {
              scaleY: [1, 0.7, 1.1, 1],
              scaleX: [1, 1.25, 0.9, 1],
            } : status === "attack" ? {
              scaleY: [1, 1.2, 0.85, 1],
              scaleX: [1, 0.85, 1.15, 1],
            } : {
              scaleY: [1, 1.05, 0.95, 1],
              scaleX: [1, 0.96, 1.04, 1],
            }}
            transition={{
              repeat: status === "idle" ? Infinity : 0,
              duration: status === "idle" ? 2.5 : 0.4,
              ease: "easeInOut"
            }}
          />
          {/* Big Cartoon Eyes */}
          <circle cx="48" cy="58" r="7.5" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="49" cy="57" r="3.5" fill="#000000" />
          <circle cx="51" cy="55" r="1.5" fill="#ffffff" />

          <circle cx="72" cy="58" r="7.5" fill="#ffffff" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="73" cy="57" r="3.5" fill="#000000" />
          <circle cx="75" cy="55" r="1.5" fill="#ffffff" />

          {/* Rosy cheeks */}
          <circle cx="40" cy="65" r="3" fill="#f43f5e" opacity="0.6" />
          <circle cx="80" cy="65" r="3" fill="#f43f5e" opacity="0.6" />

          {/* Happy smile */}
          <path d="M56 65 Q60 69 64 65" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
        </svg>
      );
    case "spider":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClasses}
        >
          {/* Leg shadows / Legs */}
          <path d="M45 55 Q20 35 12 50" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45 62 Q15 62 8 72" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M45 70 Q20 85 15 95" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M75 55 Q100 35 108 50" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M75 62 Q105 62 112 72" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M75 70 Q100 85 105 95" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Abdomen */}
          <circle cx="60" cy="72" r="18" fill="#d97706" stroke="#1e293b" strokeWidth="3.5" />
          <path d="M52 62 Q60 70 68 62" stroke="#1e293b" strokeWidth="2" fill="none" />

          {/* Head */}
          <circle cx="60" cy="52" r="11" fill="#b45309" stroke="#1e293b" strokeWidth="3" />

          {/* Big Goofy Eyes */}
          <circle cx="55" cy="49" r="4.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="56" cy="49" r="2.2" fill="#000" />
          <circle cx="65" cy="49" r="4.5" fill="#ffffff" stroke="#1e293b" strokeWidth="1.5" />
          <circle cx="64" cy="49" r="2.2" fill="#000" />
        </svg>
      );
    case "bat":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClasses}
        >
          {/* Wings */}
          <motion.path
            d="M48 60 Q15 35 8 60 L28 68 Z"
            fill="#475569"
            stroke="#1e293b"
            strokeWidth="3"
            animate={{ rotate: status === "attack" ? [-25, 20, -25] : [-10, 10, -10] }}
            style={{ originX: "48px", originY: "60px" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          />
          <motion.path
            d="M72 60 Q105 35 112 60 L92 68 Z"
            fill="#475569"
            stroke="#1e293b"
            strokeWidth="3"
            animate={{ rotate: [10, -10, 10] }}
            style={{ originX: "72px", originY: "60px" }}
            transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
          />

          {/* Body */}
          <circle cx="60" cy="62" r="15" fill="#334155" stroke="#1e293b" strokeWidth="3.5" />

          {/* Cute fangs */}
          <path d="M55 64 Q60 67 65 64" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" />
          <polygon points="56,65 58,69 60,65" fill="#ffffff" />
          <polygon points="64,65 62,69 60,65" fill="#ffffff" />

          {/* Glowing Red Eyes */}
          <circle cx="54" cy="56" r="3.5" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
          <circle cx="66" cy="56" r="3.5" fill="#ef4444" stroke="#1e293b" strokeWidth="1" />
        </svg>
      );
    case "golem":
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClasses}
        >
          {/* Rock fists */}
          <motion.circle
            cx="18"
            cy="70"
            r="12"
            fill="#78716c"
            stroke="#1e293b"
            strokeWidth="3.5"
            animate={status === "attack" ? { y: [0, -20, 0] } : { y: [0, -6, 0] }}
            transition={{ repeat: status === "idle" ? Infinity : 0, duration: 1.5 }}
          />
          <motion.circle
            cx="102"
            cy="70"
            r="12"
            fill="#78716c"
            stroke="#1e293b"
            strokeWidth="3.5"
            animate={status === "attack" ? { y: [0, -20, 0] } : { y: [0, -6, 0] }}
            transition={{ repeat: status === "idle" ? Infinity : 0, duration: 1.5 }}
          />

          {/* Main rock body */}
          <rect x="30" y="38" width="60" height="50" rx="10" fill="#a8a29e" stroke="#1e293b" strokeWidth="3.5" />
          {/* Mossy head patch */}
          <rect x="38" y="44" width="12" height="6" rx="2" fill="#10b981" />
          <rect x="70" y="70" width="14" height="8" rx="2" fill="#10b981" />

          {/* Big Glowing Cyan Eyes */}
          <circle cx="48" cy="54" r="6" fill="#06b6d4" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="49" cy="53" r="2.2" fill="#ffffff" />
          <circle cx="72" cy="54" r="6" fill="#06b6d4" stroke="#1e293b" strokeWidth="2.5" />
          <circle cx="73" cy="53" r="2.2" fill="#ffffff" />
        </svg>
      );
    case "eye":
    default:
      return (
        <svg
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={svgClasses}
        >
          {/* Demon wings */}
          <motion.path
            d="M10 50 Q30 20 45 55 T20 70 Z"
            fill="#450a0a"
            stroke="#1e293b"
            strokeWidth="3"
            animate={{ rotate: status === "attack" ? [-12, 6, -12] : 0 }}
          />
          <motion.path
            d="M110 50 Q90 20 75 55 T100 70 Z"
            fill="#450a0a"
            stroke="#1e293b"
            strokeWidth="3"
            animate={{ rotate: status === "attack" ? [12, -6, 12] : 0 }}
          />

          {/* Central Body Eye */}
          <circle cx="60" cy="60" r="28" fill="#e2e8f0" stroke="#1e293b" strokeWidth="3.5" />
          <circle cx="60" cy="60" r="16" fill="#ef4444" stroke="#7f1d1d" strokeWidth="2.5" />
          <motion.circle
            cx="60"
            cy="60"
            r="8"
            fill="#000000"
            animate={{ scale: status === "attack" ? [1, 1.3, 1] : [1, 1.1, 1] }}
            transition={{ repeat: Infinity, duration: 1.8 }}
          />
          <circle cx="63" cy="57" r="2.5" fill="#ffffff" />

          {/* Angry eyebrows */}
          <path d="M35 38 L58 46" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
          <path d="M85 38 L62 46" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
        </svg>
      );
  }
};

export default function BossHud({
  status,
  playerStatus,
  hp,
  maxHp,
  name,
  level,
  playerHp,
  playerMaxHp,
  monsterType,
  playerLvl,
  timerMax,
  timerFrozen,
  isAnswered,
  questionId,
  timeLeftRef,
  onTimeOut,
}: BossHudProps) {
  const [activeProjectile, setActiveProjectile] = useState<"player-slash" | "boss-fireball" | null>(null);
  const [playerParticles, setPlayerParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [bossParticles, setBossParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const prevStatusRef = useRef(status);
  const arenaBgClass = getMonsterBgClass(monsterType);

  // Trigger projectile and particle animations based on state changes
  useEffect(() => {
    // 1. Player attacks Boss
    if (status === "damage" && prevStatusRef.current !== "damage") {
      setActiveProjectile("player-slash");
      const timer = setTimeout(() => {
        setActiveProjectile(null);
        // Create impact particles on Boss
        const newParticles = Array.from({ length: 8 }).map((_, i) => ({
          id: Math.random() + i,
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
        }));
        setBossParticles(newParticles);
        setTimeout(() => setBossParticles([]), 550);
      }, 350);
    }

    // 2. Boss attacks Player
    if (status === "attack" && prevStatusRef.current !== "attack") {
      setActiveProjectile("boss-fireball");
      const timer = setTimeout(() => {
        setActiveProjectile(null);
        // Create impact particles on Player
        const newParticles = Array.from({ length: 8 }).map((_, i) => ({
          id: Math.random() + i,
          x: (Math.random() - 0.5) * 80,
          y: (Math.random() - 0.5) * 80,
        }));
        setPlayerParticles(newParticles);
        setTimeout(() => setPlayerParticles([]), 550);
      }, 350);
    }

    prevStatusRef.current = status;
  }, [status]);

  return (
    <div className="relative w-full flex flex-col items-center select-none font-mono text-zinc-900 dark:text-zinc-100">
      {/* CSS Animations style tag */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .arena-animate-float {
          animation: float-slow 4s ease-in-out infinite;
        }
        .arena-animate-bounce-slow {
          animation: bounce-slow 3s ease-in-out infinite;
        }
      `}</style>

      {/* ─── HP STATS HUD PANELS (Rounded, Cartoon 2D Outlined - Split 2 sides with hearts) ─── */}
      <div className="w-full bg-white dark:bg-navy-blue border-3 border-zinc-900 dark:border-zinc-700 p-3 shadow-md shadow-stone-800/10 dark:shadow-none grid grid-cols-12 gap-1 mb-4 items-center rounded-none">
        {/* Left Column: Player Stats (5 cols) */}
        <div className="col-span-5 flex flex-col items-start">
          <div className="text-[10px] md:text-xs text-zinc-900 dark:text-zinc-200 font-extrabold tracking-wider mb-1 flex items-center gap-1">
            🛡️ DŨNG SĨ (CẤP {playerLvl})
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <div className="flex gap-0.5">
              {Array.from({ length: playerMaxHp }).map((_, index) => {
                const isFilled = index < playerHp;
                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={isFilled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isFilled
                        ? "text-red-500 fill-red-500 stroke-zinc-900 dark:stroke-zinc-950 stroke-2 filter drop-shadow-[0.5px_1px_0px_rgba(24,24,27,1)]"
                        : "text-zinc-350 fill-zinc-100 dark:fill-zinc-800 stroke-zinc-400 dark:stroke-zinc-600 stroke-1"
                        }`}
                    />
                  </motion.div>
                );
              })}
            </div>
            <span className="text-[10px] md:text-xs text-emerald-600 dark:text-emerald-400 font-extrabold font-mono ml-0.5">{playerHp}/{playerMaxHp}</span>
          </div>
        </div>

        {/* Middle Column: Vertical Dash Divider (2 cols) */}
        <div className="col-span-2 flex justify-center h-8">
          <div className="w-[1.5px] h-full border-l-2 border-dashed border-zinc-300 dark:border-zinc-800" />
        </div>

        {/* Right Column: Boss Stats (5 cols) */}
        <div className="col-span-5 flex flex-col items-end">
          <div className="text-[10px] md:text-xs text-zinc-900 dark:text-zinc-200 font-extrabold tracking-wider mb-1 flex items-center gap-1 justify-end">
            {monsterType === "golem" || monsterType === "eye" ? (
              <Skull className="w-3 h-3 text-red-500" />
            ) : (
              <Swords className="w-3 h-3 text-zinc-700 dark:text-zinc-400" />
            )}
            {name}
          </div>
          <div className="flex items-center gap-1.5 justify-end flex-wrap">
            <span className="text-[10px] md:text-xs text-rose-600 dark:text-rose-400 font-extrabold font-mono mr-0.5">{hp}/{maxHp}</span>
            <div className="flex gap-0.5 justify-end">
              {Array.from({ length: maxHp }).map((_, index) => {
                const isFilled = index < hp;
                return (
                  <motion.div
                    key={index}
                    initial={false}
                    animate={isFilled ? { scale: [1, 1.2, 1] } : { scale: 1 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Heart
                      className={`w-3.5 h-3.5 md:w-4 md:h-4 ${isFilled
                        ? "text-rose-500 fill-rose-500 stroke-zinc-900 dark:stroke-zinc-950 stroke-2 filter drop-shadow-[0.5px_1px_0px_rgba(24,24,27,1)]"
                        : "text-zinc-355 fill-zinc-100 dark:fill-zinc-800 stroke-zinc-400 dark:stroke-zinc-600 stroke-1"
                        }`}
                    />
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ─── RPG BATTLE ARENA (PLAYER VS MONSTER/BOSS) ─── */}
      <div
        className={`w-full h-56 md:h-72 lg:h-80 border-4 border-zinc-900 dark:border-zinc-700 rounded-none relative flex justify-between items-end px-3 md:px-6 lg:px-8 pb-3 overflow-hidden shadow-lg shadow-stone-800/12 dark:shadow-none ${arenaBgClass}`}
      >
        {/* Cartoon cloud decoration (Only in slime stage) */}
        {monsterType === "slime" && (
          <div className="absolute top-4 left-1/4 w-12 h-6 bg-white/50 dark:bg-white/10 rounded-full blur-[1px] pointer-events-none animate-[float-slow_12s_infinite_linear]" />
        )}

        {/* Decorative Grid Line in middle (shifted down to clear the stopwatch timer) */}
        <div className="absolute left-1/2 top-20 md:top-24 lg:top-28 bottom-0 w-[2px] bg-zinc-900/10 dark:bg-zinc-950/20 border-l border-dashed border-zinc-900/20 pointer-events-none" />

        {/* ⏳ HIGH-PERFORMANCE CIRCULAR STOPWATCH TIMER */}
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30">
          <CircularTimer
            timerMax={timerMax}
            timerFrozen={timerFrozen}
            isAnswered={isAnswered}
            questionId={questionId}
            timeLeftRef={timeLeftRef}
            onTimeOut={onTimeOut}
          />
        </div>

        {/* ─── 1. PLAYER VISUAL MODEL (LEFT) ─── */}
        <div className="relative flex flex-col items-center w-28 md:w-36 lg:w-48 mb-1 md:mb-2">
          <motion.div
            className="arena-animate-bounce-slow flex flex-col items-center relative"
            animate={{
              scale: playerStatus === "damage" ? [1, 0.8, 1.1, 1] : playerStatus === "attack" ? [1, 1.2, 1] : 1,
              x: playerStatus === "attack" ? [0, 45, 0] : 0,
              filter: playerStatus === "damage" ? "brightness(1.8) contrast(1.2)" : "none",
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Evolve Scale wrapper for mobile */}
            <div className="scale-[0.55] md:scale-[0.75] lg:scale-[0.9] xl:scale-100 origin-bottom transform-gpu flex items-center justify-center">
              <RivePlayer playerLvl={playerLvl} />
            </div>

            <span className="text-[9px] md:text-[10px] font-extrabold text-zinc-900 dark:text-zinc-200 mt-1 md:mt-2 bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 px-1.5 py-0.5 tracking-wider shadow-sm">
              DŨNG SĨ
            </span>
          </motion.div>

          {/* Player Damage Particles */}
          <AnimatePresence>
            {playerParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-2 h-2 bg-red-500 rounded-full border border-zinc-900 dark:border-zinc-950 z-20"
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: p.x, y: p.y, scale: 0.1, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ─── 2. MID-ZONE: CARTOON PROJECTILES ─── */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <AnimatePresence>
            {/* Player to Boss Projectile (Cute Flying Sword) */}
            {activeProjectile === "player-slash" && (
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ x: -100, y: 0, scale: 0.6, opacity: 0.9 }}
                animate={{ x: 100, y: 0, scale: [0.6, 1.2, 0.8], opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <svg width="30" height="30" viewBox="0 0 40 40" className="filter drop-shadow-[0_0_8px_rgba(56,189,248,0.5)] -rotate-90">
                  <path d="M5 35 L35 5" stroke="#1e293b" strokeWidth="4.5" strokeLinecap="round" />
                  <path d="M5 35 L35 5" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M12 28 L28 12" stroke="#ffffff" strokeWidth="1" strokeLinecap="round" />
                </svg>
                <div className="w-12 h-2 bg-gradient-to-r from-sky-400 to-white/95 filter blur-[1px] ml-1 rounded-full" />
              </motion.div>
            )}

            {/* Boss to Player Projectile (Cute Fireball) */}
            {activeProjectile === "boss-fireball" && (
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ x: 100, y: 0, scale: 0.6, opacity: 0.9 }}
                animate={{ x: -100, y: 0, scale: [0.6, 1.2, 0.8], opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="w-12 h-2 bg-gradient-to-l from-red-500 to-amber-300 filter blur-[1px] mr-1 rounded-full" />
                <svg width="30" height="30" viewBox="0 0 40 40" className="filter drop-shadow-[0_0_8px_rgba(239,68,68,0.5)]">
                  <circle cx="20" cy="20" r="10" fill="#f97316" stroke="#1e293b" strokeWidth="3.5" />
                  <circle cx="20" cy="20" r="5" fill="#fde047" />
                  <path d="M28 14 L36 12 L32 20 L38 24 L28 26 Z" fill="#ef4444" stroke="#1e293b" strokeWidth="2" />
                </svg>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 3. ENEMY VISUAL MODEL (RIGHT) ─── */}
        <div className="relative flex flex-col items-center w-28 md:w-36 lg:w-48 mb-1 md:mb-2">
          <AnimatePresence>
            {status !== "defeat" && (
              <motion.div
                className="arena-animate-bounce-slow flex flex-col items-center relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: status === "damage" ? [1, 0.8, 1.1, 1] : status === "attack" ? [1, 1.2, 1] : 1,
                  x: status === "attack" ? [0, -45, 0] : 0,
                  filter: status === "damage" ? "brightness(1.8) contrast(1.2)" : "none",
                  opacity: 1,
                }}
                exit={{
                  scale: [1, 1.25, 0],
                  rotate: [0, 15, -15, 360],
                  opacity: 0,
                  filter: "brightness(3) contrast(2)",
                }}
                transition={{ duration: 0.4 }}
              >
                {/* Render Monster Custom SVG */}
                {renderMonsterSvg(monsterType, status)}

                <span className="text-[9px] md:text-[10px] font-extrabold text-zinc-900 dark:text-zinc-200 mt-1 md:mt-2 bg-white dark:bg-zinc-800 border-2 border-zinc-900 dark:border-zinc-700 px-1.5 py-0.5 tracking-wider shadow-sm">
                  {name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Enemy Damage Particles */}
          <AnimatePresence>
            {bossParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1.5 h-1.5 bg-orange-500 rounded-none z-20"
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: p.x, y: p.y, scale: 0.1, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
