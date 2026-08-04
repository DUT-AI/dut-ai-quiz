"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Heart, Smile } from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeedbackSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface HeartParticle {
  x: number;
  y: number;
  size: number;
  vx: number;
  vy: number;
  alpha: number;
  decay: number;
  color: string;
  rotation: number;
  rotationSpeed: number;
  drift: number; // speed of drifting left/right
  driftSpeed: number;
}

export function FeedbackSuccessModal({ isOpen, onClose }: FeedbackSuccessModalProps) {
  const [mounted, setMounted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle escape key
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Disable scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Canvas heart animation effect
  useEffect(() => {
    if (!isOpen || !mounted) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    const particles: HeartParticle[] = [];

    // Helper to draw a heart shape
    const drawHeart = (
      c: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: string,
      alpha: number,
      rotation: number
    ) => {
      c.save();
      c.translate(x, y);
      c.rotate(rotation);
      c.globalAlpha = alpha;
      c.fillStyle = color;
      c.beginPath();

      const d = size;
      c.moveTo(0, -d / 4);
      // Left side curve
      c.bezierCurveTo(-d / 2, -d / 2, -d, -d / 10, 0, d);
      // Right side curve
      c.bezierCurveTo(d, -d / 10, d / 2, -d / 2, 0, -d / 4);

      c.closePath();
      c.fill();
      c.restore();
    };

    // Spawn heart particles
    const colors = [
      "rgba(244, 63, 94, 0.8)",  // Pink rose-500
      "rgba(251, 113, 133, 0.8)", // Rose-400
      "rgba(236, 72, 153, 0.8)",  // Pink-500
      "rgba(244, 114, 182, 0.8)", // Pink-400
      "rgba(239, 68, 68, 0.8)",   // Red-500
      "rgba(252, 165, 165, 0.8)", // Red-300
    ];

    const spawnHeart = () => {
      // Spawn mostly from the bottom of the screen or randomly around the middle
      const fromBottom = Math.random() > 0.3;
      const x = Math.random() * width;
      const y = fromBottom ? height + 20 : Math.random() * (height * 0.7) + height * 0.2;
      const size = Math.random() * 15 + 8; // 8px to 23px size
      
      particles.push({
        x,
        y,
        size,
        vx: Math.random() * 1.5 - 0.75,
        vy: -(Math.random() * 2.5 + 1.5), // float upwards
        alpha: Math.random() * 0.4 + 0.6, // initial opacity
        decay: Math.random() * 0.005 + 0.005, // slowly fade away
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 0.2 - Math.PI * 0.1, // slight tilt
        rotationSpeed: Math.random() * 0.02 - 0.01,
        drift: Math.random() * 0.05,
        driftSpeed: Math.random() * 0.02 + 0.01,
      });
    };

    // Pre-populate with some particles for instant effect when modal loads
    for (let i = 0; i < 25; i++) {
      spawnHeart();
      // Fast forward particles so they are spread out
      const p = particles[particles.length - 1];
      p.y = Math.random() * height;
      p.alpha = Math.random() * 0.8 + 0.2;
    }

    const loop = () => {
      ctx.clearRect(0, 0, width, height);

      // Periodically spawn new hearts
      if (particles.length < 50 && Math.random() < 0.15) {
        spawnHeart();
      }

      // Update & Draw Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.y += p.vy;
        p.x += p.vx + Math.sin(Date.now() * p.drift) * 0.5;
        p.rotation += p.rotationSpeed;
        p.alpha -= p.decay;

        if (p.alpha <= 0 || p.y < -20) {
          particles.splice(i, 1);
          continue;
        }

        drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha, p.rotation);
      }

      animationFrameId = requestAnimationFrame(loop);
    };

    loop();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [isOpen, mounted]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
        onClick={onClose}
      />

      {/* Floating Hearts Canvas Effect */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none z-[55]"
        style={{ mixBlendMode: "normal" }}
      />
      
      {/* Dialog Container */}
      <div className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-gray-150 dark:border-white/10 bg-white dark:bg-[#1A263B] shadow-2xl transition-all duration-300 animate-in zoom-in-95 fade-in duration-200 z-[60] text-center">
        
        {/* Top Accent Pink Line */}
        <div className="h-1.5 w-full bg-gradient-to-r from-pink-500 via-rose-500 to-red-500" />

        <div className="p-8 space-y-6">
          <div className="flex flex-col items-center">
            
            {/* Heart Icon Container with pulse and float animation */}
            <div className="flex size-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-500 shadow-md shadow-rose-500/5 mb-4 animate-bounce">
              <Heart className="size-8 fill-rose-500/25" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-black text-dark-blue dark:text-white leading-tight mb-2">
              Cảm ơn sự đóng góp của bạn!
            </h3>

            {/* Description */}
            <p className="text-xs sm:text-sm text-gray-navy/70 dark:text-light-blue/70 leading-relaxed max-w-sm mb-2">
              Ý kiến đóng góp của bạn đã được đăng tải thành công. Phản hồi này sẽ được đội ngũ kiểm duyệt xem xét để cải thiện hệ thống tốt hơn mỗi ngày.
            </p>
          </div>

          {/* Action Button */}
          <div className="flex justify-center pt-2">
            <Button
              onClick={onClose}
              className="rounded-xl px-8 h-10 text-xs font-black shadow-md bg-rose-500 hover:bg-rose-600 text-white border-0"
            >
              Đồng ý
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
