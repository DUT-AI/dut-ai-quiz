"use client";

import React, { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  gravity: number;
  friction: number;
  history: { x: number; y: number }[];
  maxHistory: number;
  size: number;
}

interface Rocket {
  x: number;
  y: number;
  tx: number;
  ty: number;
  vx: number;
  vy: number;
  color: string;
  history: { x: number; y: number }[];
  maxHistory: number;
}

export default function GameFireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.offsetWidth || window.innerWidth);
    let height = (canvas.height = canvas.offsetHeight || window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = canvas.offsetWidth || window.innerWidth;
      height = canvas.height = canvas.offsetHeight || window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: Particle[] = [];
    const rockets: Rocket[] = [];

    const createExplosion = (x: number, y: number, color: string) => {
      const particleCount = Math.floor(Math.random() * 35) + 35; // 35-70 particles
      for (let i = 0; i < particleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 5 + 1.5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.012 + 0.008,
          color,
          gravity: 0.05,
          friction: 0.98,
          history: [],
          maxHistory: 5,
          size: Math.random() * 2 + 1,
        });
      }

      // Add crackles (sparkles)
      const sparkleCount = Math.floor(Math.random() * 12) + 8;
      for (let i = 0; i < sparkleCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 2;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          alpha: 1,
          decay: Math.random() * 0.025 + 0.015,
          color: "#FFFFFF",
          gravity: 0.07,
          friction: 0.96,
          history: [],
          maxHistory: 3,
          size: Math.random() * 1.5 + 0.5,
        });
      }
    };

    const spawnRocket = () => {
      const startX = Math.random() * (width * 0.8) + width * 0.1;
      const startY = height;
      const targetX = Math.random() * (width * 0.8) + width * 0.1;
      const targetY = Math.random() * (height * 0.45) + height * 0.05; // Top 50% of screen

      const dx = targetX - startX;
      const dy = targetY - startY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const steps = Math.random() * 25 + 40;

      const hue = Math.random() * 360;
      const color = `hsl(${hue}, 100%, 65%)`;

      rockets.push({
        x: startX,
        y: startY,
        tx: targetX,
        ty: targetY,
        vx: dx / steps,
        vy: dy / steps,
        color,
        history: [],
        maxHistory: 12,
      });
    };

    let lastSpawn = Date.now();

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      const now = Date.now();
      if (now - lastSpawn > Math.random() * 600 + 500) {
        spawnRocket();
        lastSpawn = now;
      }

      // Update & Draw Rockets
      for (let i = rockets.length - 1; i >= 0; i--) {
        const r = rockets[i];
        r.history.push({ x: r.x, y: r.y });
        if (r.history.length > r.maxHistory) {
          r.history.shift();
        }

        r.x += r.vx;
        r.y += r.vy;

        // Check if rocket reached destination
        const reached = r.vy >= 0 || r.y <= r.ty;
        if (reached) {
          createExplosion(r.x, r.y, r.color);
          rockets.splice(i, 1);
          continue;
        }

        // Draw rocket trail
        if (r.history.length > 1) {
          ctx.beginPath();
          ctx.moveTo(r.history[0].x, r.history[0].y);
          for (let h = 1; h < r.history.length; h++) {
            ctx.lineTo(r.history[h].x, r.history[h].y);
          }
          ctx.strokeStyle = r.color;
          ctx.lineWidth = 2;
          ctx.lineCap = "round";
          ctx.stroke();
        }
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.history.push({ x: p.x, y: p.y });
        if (p.history.length > p.maxHistory) {
          p.history.shift();
        }

        p.vx *= p.friction;
        p.vy *= p.friction;
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.alpha -= p.decay;

        if (p.alpha <= 0) {
          particles.splice(i, 1);
          continue;
        }

        // Draw particle trail
        if (p.history.length > 1) {
          ctx.save();
          ctx.globalAlpha = p.alpha;
          ctx.beginPath();
          ctx.moveTo(p.history[0].x, p.history[0].y);
          for (let h = 1; h < p.history.length; h++) {
            ctx.lineTo(p.history[h].x, p.history[h].y);
          }
          ctx.strokeStyle = p.color;
          ctx.lineWidth = p.size;
          ctx.lineCap = "round";
          ctx.shadowBlur = 4;
          ctx.shadowColor = p.color;
          ctx.stroke();
          ctx.restore();
        }
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-0"
      style={{ mixBlendMode: "screen" }}
    />
  );
}
