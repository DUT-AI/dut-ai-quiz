"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

export function GameTabBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Generate deterministic floating particles to avoid hydration mismatches
  const particles = [
    { id: 1, size: 8, x: "15%", y: "20%", duration: 25, delay: 0 },
    { id: 2, size: 12, x: "85%", y: "15%", duration: 30, delay: 2 },
    { id: 3, size: 6, x: "45%", y: "75%", duration: 22, delay: 5 },
    { id: 4, size: 14, x: "25%", y: "85%", duration: 28, delay: 1 },
    { id: 5, size: 10, x: "75%", y: "65%", duration: 35, delay: 3 },
  ];

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
      {/* 1. Cyber Mesh Grid Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#8080800b_1px,transparent_1px),linear-gradient(to_bottom,#8080800b_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
      />

      {/* 2. Light Sweep Grid Effect */}
      <motion.div
        animate={{
          y: ["-100%", "100%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-x-0 h-[200px] bg-gradient-to-b from-transparent via-indigo-500/[0.03] dark:via-indigo-400/[0.02] to-transparent"
      />

      {/* 3. Ambient Pulsating Neon Spotlights */}
      {/* Top Left Spotlight (Indigo/Purple) */}
      <motion.div
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -top-20 -left-20 w-[24rem] h-[24rem] rounded-full bg-gradient-to-tr from-indigo-500/20 via-purple-500/10 to-transparent blur-3xl opacity-75 dark:opacity-90"
      />

      {/* Bottom Right Spotlight (Pink/Fuchsia) */}
      <motion.div
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 40, -30, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{
          duration: 22,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute -bottom-32 -right-32 w-[30rem] h-[30rem] rounded-full bg-gradient-to-br from-pink-500/15 via-rose-500/10 to-transparent blur-3xl opacity-70 dark:opacity-85"
      />

      {/* Center Spotlight (Cyan/Blue - Dark mode only for extra neon vibe) */}
      <motion.div
        animate={{
          scale: [0.8, 1.2, 0.8],
          opacity: [0.3, 0.6, 0.3],
        }}
        transition={{
          duration: 14,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-500/[0.04] dark:bg-cyan-500/[0.06] blur-3xl"
      />

      {/* 4. Floating Particles */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          animate={{
            y: ["0px", "-40px", "0px"],
            x: ["0px", "20px", "0px"],
            opacity: [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            left: p.x,
            top: p.y,
            width: `${p.size}px`,
            height: `${p.size}px`,
          }}
          className="rounded-full bg-indigo-500/20 dark:bg-indigo-300/30 blur-[1px] shadow-lg shadow-indigo-500/50"
        />
      ))}
    </div>
  );
}
