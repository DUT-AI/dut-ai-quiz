"use client";

import React, { useEffect, useState } from "react";

export function GameTabBackground() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-[2.5rem]">
      {/* 1. Cyber Mesh Grid Background Overlay */}
      <div 
        className="absolute inset-0 bg-[linear-gradient(to_right,#8080800b_1px,transparent_1px),linear-gradient(to_bottom,#8080800b_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" 
      />

      {/* 2. Static Ambient Spotlights (GPU Cached textures instead of continuous multi-frame blur invalidations) */}
      {/* Top Left Spotlight (Indigo) */}
      <div 
        className="absolute -top-24 -left-24 w-[28rem] h-[28rem] rounded-full bg-gradient-to-tr from-indigo-500/15 via-blue-500/10 to-transparent blur-3xl opacity-70 dark:opacity-80 pointer-events-none transform-gpu"
      />

      {/* Bottom Right Spotlight (Pink/Rose) */}
      <div 
        className="absolute -bottom-28 -right-28 w-[32rem] h-[32rem] rounded-full bg-gradient-to-br from-pink-500/10 via-rose-500/5 to-transparent blur-3xl opacity-60 dark:opacity-75 pointer-events-none transform-gpu"
      />

      {/* Center Spotlight (Cyan/Sky) */}
      <div 
        className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-cyan-500/[0.03] dark:bg-cyan-500/[0.05] blur-3xl pointer-events-none transform-gpu"
      />
    </div>
  );
}

