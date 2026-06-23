"use client";

import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Zap, Skull } from "lucide-react";

interface BossHudProps {
  status: "idle" | "attack" | "damage" | "defeat";
  hp: number; // 0 to 100
  maxHp: number;
  name: string;
  level: number;
}

export default function BossHud({ status, hp, maxHp, name, level }: BossHudProps) {
  const hpPercentage = Math.max(0, Math.min(100, (hp / maxHp) * 100));
  const [showLaser, setShowLaser] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number }[]>([]);

  // Trigger laser visual on attack status
  useEffect(() => {
    if (status === "attack") {
      setShowLaser(true);
      const timer = setTimeout(() => setShowLaser(false), 800);
      return () => clearTimeout(timer);
    }
  }, [status]);

  // Generate damage particles on damage status
  useEffect(() => {
    if (status === "damage") {
      const newParticles = Array.from({ length: 8 }).map((_, i) => ({
        id: Math.random() + i,
        x: (Math.random() - 0.5) * 120,
        y: (Math.random() - 0.5) * 120,
      }));
      setParticles(newParticles);
      const timer = setTimeout(() => setParticles([]), 600);
      return () => clearTimeout(timer);
    }
  }, [status]);

  return (
    <div className="relative w-full flex flex-col items-center select-none py-4">
      {/* CSS Animations style tag */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        @keyframes orbit-clock {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbit-counter {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes boss-pulse {
          0%, 100% { filter: drop-shadow(0 0 15px rgba(239, 68, 68, 0.4)); }
          50% { filter: drop-shadow(0 0 25px rgba(239, 68, 68, 0.7)); }
        }
        @keyframes scanline {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        .boss-animate-float {
          animation: float 4s ease-in-out infinite;
        }
        .boss-animate-orbit-cw {
          animation: orbit-clock 20s linear infinite;
        }
        .boss-animate-orbit-ccw {
          animation: orbit-counter 15s linear infinite;
        }
        .boss-glow-red {
          animation: boss-pulse 2s infinite;
        }
      `}</style>

      {/* ─── BOSS STATS & HP BAR ─── */}
      <div className="w-full max-w-md bg-zinc-950/80 border border-red-500/20 px-4 py-2 font-mono rounded-none mb-6 shadow-[0_0_15px_rgba(239,68,68,0.05)] relative overflow-hidden">
        {/* Neon warning scanline */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500/5 to-transparent h-1/2 w-full animate-[scanline_3s_linear_infinite]" />

        <div className="flex justify-between items-center text-xs text-red-400 font-bold tracking-wider mb-1.5 relative z-10">
          <div className="flex items-center gap-1.5">
            <Skull className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>{name}</span>
          </div>
          <span className="bg-red-950/60 border border-red-500/30 px-1.5 py-0.5 text-[10px]">
            LVL {level}
          </span>
        </div>

        {/* Custom HP Bar (Sharp RPG HUD Style) */}
        <div className="relative w-full h-4 bg-zinc-900 border border-red-900/50 rounded-none overflow-hidden relative z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
            initial={{ width: `${hpPercentage}%` }}
            animate={{ width: `${hpPercentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          {/* HP Text Overlay */}
          <div className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-extrabold drop-shadow-[0_1px_2px_rgba(0,0,0,1)]">
            {hp} / {maxHp} HP
          </div>
        </div>
      </div>

      {/* ─── BOSS VISUAL REPRESENTATION (SVG Mech) ─── */}
      <div className="relative w-72 h-56 flex items-center justify-center">
        <AnimatePresence>
          {status !== "defeat" && (
            <motion.div
              className="boss-animate-float w-full h-full flex items-center justify-center relative"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ 
                scale: status === "damage" ? [1, 0.85, 1.05, 1] : 1,
                rotate: status === "damage" ? [0, -5, 5, 0] : 0,
                opacity: 1 
              }}
              exit={{ 
                scale: [1, 1.2, 0],
                rotate: [0, 18, -18, 360],
                opacity: 0,
                filter: "brightness(3) contrast(2)"
              }}
              transition={{ duration: 0.4 }}
            >
              {/* Outer Neon Orbit Shield 1 */}
              <div className="absolute w-48 h-48 border border-dashed border-red-500/30 rounded-full boss-animate-orbit-cw flex items-center justify-center">
                <div className="absolute top-0 w-2.5 h-2.5 bg-red-500 shadow-[0_0_8px_#ef4444]" />
                <div className="absolute bottom-0 w-2.5 h-2.5 bg-red-500 shadow-[0_0_8px_#ef4444]" />
              </div>

              {/* Outer Neon Orbit Shield 2 (Sharp Hexagonal Orbit) */}
              <div className="absolute w-36 h-36 border border-red-400/10 rotate-45 boss-animate-orbit-ccw flex items-center justify-center">
                <div className="absolute left-0 w-2 h-2 bg-orange-400 rotate-45 shadow-[0_0_8px_#fb923c]" />
                <div className="absolute right-0 w-2 h-2 bg-orange-400 rotate-45 shadow-[0_0_8px_#fb923c]" />
              </div>

              {/* Boss Core SVG */}
              <svg
                width="140"
                height="140"
                viewBox="0 0 140 140"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="boss-glow-red relative z-10"
              >
                {/* Mech Wing / Armor Plates - Left */}
                <motion.path
                  d="M10 60 L40 30 L55 65 L25 85 Z"
                  fill="#18181b"
                  stroke="#ef4444"
                  strokeWidth="2"
                  animate={{ rotate: status === "attack" ? [-10, 5, -10] : 0 }}
                />
                
                {/* Mech Wing / Armor Plates - Right */}
                <motion.path
                  d="M130 60 L100 30 L85 65 L115 85 Z"
                  fill="#18181b"
                  stroke="#ef4444"
                  strokeWidth="2"
                  animate={{ rotate: status === "attack" ? [10, -5, 10] : 0 }}
                />

                {/* Core Body Hexagon */}
                <polygon
                  points="70,20 105,45 105,95 70,120 35,95 35,45"
                  fill="#09090b"
                  stroke={status === "damage" ? "#ffffff" : "#ea580c"}
                  strokeWidth="3"
                />

                {/* Inner Tech Lines */}
                <path d="M45 50 L70 35 L95 50" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" />
                <path d="M45 90 L70 105 L95 90" stroke="#f97316" strokeWidth="1.5" strokeDasharray="3 3" />

                {/* Core Eye Triangle (Glowing Focus) */}
                <polygon
                  points="70,45 92,85 48,85"
                  fill="#18181b"
                  stroke={status === "attack" ? "#ef4444" : "#f97316"}
                  strokeWidth="2"
                />

                {/* Central Eye Core Sphere */}
                <motion.circle
                  cx="70"
                  cy="72"
                  r="12"
                  fill={status === "attack" ? "#ef4444" : status === "damage" ? "#ffffff" : "#f97316"}
                  animate={{
                    scale: status === "attack" ? [1, 1.4, 1] : [1, 1.15, 1],
                  }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="shadow-[0_0_15px_#f97316]"
                />
                
                {/* Central Eye Pupil (Deadly laser emitter) */}
                <circle cx="70" cy="72" r="4" fill="#ffffff" />
              </svg>

              {/* Damage Flash Overlay */}
              {status === "damage" && (
                <div className="absolute w-32 h-32 bg-white/30 rounded-full blur-xl mix-blend-overlay animate-pulse" />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ─── ATTACK LASER ANIMATION ─── */}
        <AnimatePresence>
          {showLaser && (
            <motion.div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-red-600 via-white to-red-600 shadow-[0_0_20px_#ef4444] z-20"
              initial={{ height: 0, opacity: 0.8 }}
              animate={{ height: 350, opacity: [1, 1, 0] }}
              exit={{ opacity: 0 }}
              style={{ transformOrigin: "top center" }}
              transition={{ duration: 0.7 }}
            />
          )}
        </AnimatePresence>

        {/* ─── DAMAGE PARTICLES EFFECT ─── */}
        <AnimatePresence>
          {particles.map((p) => (
            <motion.div
              key={p.id}
              className="absolute w-2 h-2 bg-orange-500 rounded-none"
              initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
              animate={{ 
                x: p.x, 
                y: p.y, 
                scale: 0.2, 
                opacity: 0,
                rotate: 360 
              }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
