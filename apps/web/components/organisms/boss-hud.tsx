"use client";

import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Skull, Swords, Flame } from "lucide-react";

interface BossHudProps {
  status: "idle" | "attack" | "damage" | "defeat"; // Boss status
  playerStatus: "idle" | "attack" | "damage"; // Player status
  hp: number; // Boss current HP
  maxHp: number; // Boss max HP
  name: string; // Boss Name
  level: number; // Boss Level
  playerHp: number; // Player current HP
  playerMaxHp: number; // Player max HP
}

export default function BossHud({
  status,
  playerStatus,
  hp,
  maxHp,
  name,
  level,
  playerHp,
  playerMaxHp,
}: BossHudProps) {
  const bossHpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const playerHpPercentage = Math.max(0, Math.min(100, (playerHp / playerMaxHp) * 100));

  const [activeProjectile, setActiveProjectile] = useState<"player-slash" | "boss-fireball" | null>(null);
  const [playerParticles, setPlayerParticles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [bossParticles, setBossParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  const prevStatusRef = useRef(status);

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
    <div className="relative w-full flex flex-col items-center select-none py-2 font-mono">
      {/* CSS Animations style tag */}
      <style jsx global>{`
        @keyframes float-slow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes orbit-cw {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit-ccw {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes aura-pulse {
          0%, 100% { filter: drop-shadow(0 0 10px rgba(16, 185, 129, 0.3)); }
          50% { filter: drop-shadow(0 0 18px rgba(16, 185, 129, 0.5)); }
        }
        @keyframes boss-pulse {
          0%, 100% { filter: drop-shadow(0 0 12px rgba(239, 68, 68, 0.3)); }
          50% { filter: drop-shadow(0 0 20px rgba(239, 68, 68, 0.6)); }
        }
        .arena-animate-float {
          animation: float-slow 4s ease-in-out infinite;
        }
        .arena-animate-orbit-cw {
          animation: orbit-cw 20s linear infinite;
        }
        .arena-animate-orbit-ccw {
          animation: orbit-ccw 15s linear infinite;
        }
        .player-glow-green {
          animation: aura-pulse 2s infinite;
        }
        .boss-glow-red {
          animation: boss-pulse 2s infinite;
        }
      `}</style>

      {/* ─── HP STATS HUD PANELS ─── */}
      <div className="w-full max-w-3xl grid grid-cols-2 gap-6 mb-6">
        {/* Left Side: Player HP Stats */}
        <div className="bg-zinc-950/90 border border-emerald-500/20 px-3 py-1.5 rounded-none shadow-[0_0_10px_rgba(16,185,129,0.03)] relative overflow-hidden">
          <div className="flex justify-between items-center text-[10px] text-emerald-400 font-bold tracking-wider mb-1">
            <span className="flex items-center gap-1">🛡️ DŨNG SĨ</span>
            <span>CẤP 5</span>
          </div>
          <div className="relative w-full h-3 bg-zinc-900 border border-emerald-950 rounded-none overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-emerald-600 to-green-500 shadow-[0_0_6px_rgba(16,185,129,0.4)]"
              initial={{ width: `${playerHpPercentage}%` }}
              animate={{ width: `${playerHpPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              {playerHp} / {playerMaxHp} HP
            </div>
          </div>
        </div>

        {/* Right Side: Boss HP Stats */}
        <div className="bg-zinc-950/90 border border-red-500/20 px-3 py-1.5 rounded-none shadow-[0_0_10px_rgba(239,68,68,0.03)] relative overflow-hidden">
          <div className="flex justify-between items-center text-[10px] text-red-400 font-bold tracking-wider mb-1">
            <span className="flex items-center gap-1"><Skull className="w-3 h-3 text-red-500 animate-pulse" /> {name}</span>
            <span>LVL {level}</span>
          </div>
          <div className="relative w-full h-3 bg-zinc-900 border border-red-950 rounded-none overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"
              initial={{ width: `${bossHpPercentage}%` }}
              animate={{ width: `${bossHpPercentage}%` }}
              transition={{ duration: 0.3 }}
            />
            <div className="absolute inset-0 flex items-center justify-center text-[8px] text-white font-extrabold drop-shadow-[0_1px_1px_rgba(0,0,0,1)]">
              {hp} / {maxHp} HP
            </div>
          </div>
        </div>
      </div>

      {/* ─── RPG BATTLE ARENA (PLAYER VS BOSS) ─── */}
      <div className="w-full max-w-3xl h-64 border border-zinc-800 bg-zinc-950/40 rounded-none relative flex justify-between items-center px-8 overflow-hidden shadow-[0_0_20px_rgba(0,0,0,0.6)]">
        
        {/* Decorative Grid Line in middle */}
        <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-zinc-900/60 border-l border-dashed border-zinc-800/20 pointer-events-none" />

        {/* ─── 1. PLAYER VISUAL MODEL (LEFT) ─── */}
        <div className="relative flex flex-col items-center w-36 h-full justify-center">
          <motion.div
            className="arena-animate-float flex flex-col items-center relative"
            animate={{
              scale: playerStatus === "damage" ? [1, 0.85, 1.05, 1] : playerStatus === "attack" ? [1, 1.1, 1] : 1,
              x: playerStatus === "attack" ? [0, 30, 0] : 0,
              filter: playerStatus === "damage" ? "brightness(2.5) contrast(1.2)" : "none",
            }}
            transition={{ duration: 0.4 }}
          >
            {/* Player Aura Orbit */}
            <div className="absolute w-24 h-24 border border-emerald-500/10 rounded-full arena-animate-orbit-cw flex items-center justify-center">
              <div className="absolute top-0 w-1.5 h-1.5 bg-emerald-400 shadow-[0_0_5px_#34d399]" />
            </div>

            {/* Player Character SVG */}
            <svg
              width="96"
              height="96"
              viewBox="0 0 120 120"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="player-glow-green relative z-10"
            >
              {/* Helmet Crest / Plume */}
              <path d="M60 8 L60 30" stroke="#34d399" strokeWidth="4" strokeLinecap="round" />
              <path d="M50 15 L60 8 L70 15" stroke="#34d399" strokeWidth="3" />

              {/* Main Knight Shield-Face */}
              <polygon
                points="60,20 92,38 92,82 60,105 28,82 28,38"
                fill="#0c0a09"
                stroke={playerStatus === "damage" ? "#ffffff" : "#10b981"}
                strokeWidth="2.5"
              />

              {/* Visor Area */}
              <polygon
                points="38,48 82,48 74,68 46,68"
                fill="#1c1917"
                stroke="#059669"
                strokeWidth="1.5"
              />

              {/* Glowing Eyes */}
              <motion.circle
                cx="50"
                cy="58"
                r="2"
                fill="#22d3ee"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
              <motion.circle
                cx="70"
                cy="58"
                r="2"
                fill="#22d3ee"
                animate={{ scale: [1, 1.3, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />

              {/* Crossed Sword Behind */}
              <path d="M22 98 L40 80" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M98 98 L80 80" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" />
            </svg>

            <span className="text-[9px] font-bold text-emerald-400 mt-2 bg-emerald-950/40 border border-emerald-900/60 px-1.5 py-0.5 tracking-wider">
              DŨNG SĨ
            </span>
          </motion.div>

          {/* Player Damage Particles */}
          <AnimatePresence>
            {playerParticles.map((p) => (
              <motion.div
                key={p.id}
                className="absolute w-1.5 h-1.5 bg-red-500 rounded-none z-20"
                initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
                animate={{ x: p.x, y: p.y, scale: 0.1, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            ))}
          </AnimatePresence>
        </div>

        {/* ─── 2. MID-ZONE: CLASH & PROJECTILES ─── */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
          <AnimatePresence>
            {/* Player to Boss Projectile (Slash Wave) */}
            {activeProjectile === "player-slash" && (
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ x: -140, y: 0, scale: 0.5, opacity: 0.8 }}
                animate={{ x: 140, y: 0, scale: [0.5, 1, 0.8], opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <Swords className="w-8 h-8 text-cyan-400 filter drop-shadow-[0_0_10px_#22d3ee] rotate-45" />
                <div className="w-12 h-2 bg-gradient-to-r from-cyan-500 to-white filter blur-[1px] ml-2" />
              </motion.div>
            )}

            {/* Boss to Player Projectile (Crimson Fireball) */}
            {activeProjectile === "boss-fireball" && (
              <motion.div
                className="absolute flex items-center justify-center"
                initial={{ x: 140, y: 0, scale: 0.6, opacity: 0.8 }}
                animate={{ x: -140, y: 0, scale: [0.6, 1.2, 0.9], opacity: [1, 1, 0] }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              >
                <div className="w-10 h-1.5 bg-gradient-to-l from-red-500 to-white filter blur-[1px] mr-2" />
                <Flame className="w-8 h-8 text-red-500 filter drop-shadow-[0_0_10px_#ef4444] animate-pulse" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ─── 3. BOSS VISUAL MODEL (RIGHT) ─── */}
        <div className="relative flex flex-col items-center w-36 h-full justify-center">
          <AnimatePresence>
            {status !== "defeat" && (
              <motion.div
                className="arena-animate-float flex flex-col items-center relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{
                  scale: status === "damage" ? [1, 0.85, 1.05, 1] : status === "attack" ? [1, 1.1, 1] : 1,
                  x: status === "attack" ? [0, -30, 0] : 0,
                  filter: status === "damage" ? "brightness(2.5) contrast(1.2)" : "none",
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
                {/* Boss Outer Orbit */}
                <div className="absolute w-24 h-24 border border-dashed border-red-500/20 rounded-full arena-animate-orbit-ccw flex items-center justify-center">
                  <div className="absolute bottom-0 w-1.5 h-1.5 bg-red-400 shadow-[0_0_5px_#f87171]" />
                </div>

                {/* Boss Core SVG */}
                <svg
                  width="96"
                  height="96"
                  viewBox="0 0 120 120"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="boss-glow-red relative z-10"
                >
                  {/* Wing - Left */}
                  <motion.path
                    d="M10 50 L35 25 L45 55 L20 70 Z"
                    fill="#0f0f12"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    animate={{ rotate: status === "attack" ? [-8, 4, -8] : 0 }}
                  />

                  {/* Wing - Right */}
                  <motion.path
                    d="M110 50 L85 25 L75 55 L100 70 Z"
                    fill="#0f0f12"
                    stroke="#ef4444"
                    strokeWidth="1.5"
                    animate={{ rotate: status === "attack" ? [8, -4, 8] : 0 }}
                  />

                  {/* Core Body Hexagon */}
                  <polygon
                    points="60,18 90,38 90,82 60,102 30,82 30,38"
                    fill="#09090b"
                    stroke={status === "damage" ? "#ffffff" : "#ea580c"}
                    strokeWidth="2.5"
                  />

                  {/* Focus Target Ring */}
                  <circle cx="60" cy="60" r="18" stroke="#ef4444" strokeWidth="1" strokeDasharray="3 3" />

                  {/* Central Eye Core */}
                  <motion.circle
                    cx="60"
                    cy="60"
                    r="9"
                    fill={status === "attack" ? "#ef4444" : status === "damage" ? "#ffffff" : "#ea580c"}
                    animate={{
                      scale: status === "attack" ? [1, 1.35, 1] : [1, 1.1, 1],
                    }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                  
                  {/* Laser pupil dot */}
                  <circle cx="60" cy="60" r="3" fill="#ffffff" />
                </svg>

                <span className="text-[9px] font-bold text-red-500 mt-2 bg-red-950/40 border border-red-900/60 px-1.5 py-0.5 tracking-wider">
                  {name}
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Boss Damage Particles */}
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
