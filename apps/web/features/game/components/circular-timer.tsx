"use client";

import React, { useEffect, useRef } from "react";

interface CircularTimerProps {
  timerMax: number;
  timerFrozen: boolean;
  isAnswered: boolean;
  questionId: string;
  timeLeftRef: React.MutableRefObject<number>;
  onTimeOut: () => void;
}

export default function CircularTimer({
  timerMax,
  timerFrozen,
  isAnswered,
  questionId,
  timeLeftRef,
  onTimeOut,
}: CircularTimerProps) {
  const circleRef = useRef<SVGCircleElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Animation & ticking state refs
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedTimeRef = useRef<number>(0);
  const freezeStartRef = useRef<number | null>(null);
  const lastSecondRef = useRef<number>(-1);
  const hasTriggeredTimeOutRef = useRef<boolean>(false);

  // SVG dimensions & math
  // Radius = 40, Circumference = 2 * Math.PI * 40 = 251.327
  const circumference = 251.33;

  // Format seconds to m:ss
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    // 1. Reset timer whenever questionId changes
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    freezeStartRef.current = timerFrozen ? Date.now() : null;
    lastSecondRef.current = timerMax;
    timeLeftRef.current = timerMax;
    hasTriggeredTimeOutRef.current = false;

    // Reset UI display immediately
    if (textRef.current) {
      textRef.current.textContent = formatTime(timerMax);
      textRef.current.className = "text-sm md:text-base lg:text-lg font-black tracking-tight text-cyan-600 dark:text-cyan-400";
    }
    if (circleRef.current) {
      circleRef.current.style.strokeDashoffset = "0";
      circleRef.current.style.stroke = timerFrozen ? "#38bdf8" : "#06b6d4"; // Sky blue if frozen, Cyan as default
    }
    if (containerRef.current) {
      containerRef.current.classList.remove("animate-pulse", "scale-105");
    }

    // 2. Define the tick loop
    const tick = () => {
      if (isAnswered) {
        // Stop ticking but keep UI state intact
        return;
      }

      const now = Date.now();

      // Handle freeze state calculations
      if (timerFrozen) {
        if (freezeStartRef.current === null) {
          freezeStartRef.current = now;
        }
      } else {
        if (freezeStartRef.current !== null) {
          pausedTimeRef.current += now - freezeStartRef.current;
          freezeStartRef.current = null;
        }
      }

      // Calculate active elapsed time
      let elapsed = now - startTimeRef.current - pausedTimeRef.current;
      if (timerFrozen && freezeStartRef.current !== null) {
        elapsed -= now - freezeStartRef.current;
      }

      // Calculate time remaining in ms and seconds
      const timeLeftMs = Math.max(0, timerMax * 1000 - elapsed);
      const secondsLeft = Math.ceil(timeLeftMs / 1000);

      // Update parent ref for response time calculations (done silently without re-renders)
      timeLeftRef.current = secondsLeft;

      // Update progress SVG and text directly
      const progress = timeLeftMs / (timerMax * 1000);
      const offset = circumference * (1 - progress);

      if (circleRef.current) {
        circleRef.current.style.strokeDashoffset = String(offset);
      }

      // Only update DOM text and color state when integer seconds change (less DOM thrashing)
      if (secondsLeft !== lastSecondRef.current) {
        lastSecondRef.current = secondsLeft;
        
        if (textRef.current) {
          textRef.current.textContent = formatTime(secondsLeft);
        }

        // Color thresholds
        let strokeColor = "#06b6d4"; // Cyan-500
        let textColorClass = "text-cyan-600 dark:text-cyan-400";

        if (timerFrozen) {
          strokeColor = "#38bdf8"; // Sky blue (sky-400)
          textColorClass = "text-sky-550 dark:text-sky-400";
        } else if (progress <= 0.25) {
          strokeColor = "#ef4444"; // Red (red-500)
          textColorClass = "text-red-500 dark:text-red-400 animate-pulse";
        } else if (progress <= 0.5) {
          strokeColor = "#f59e0b"; // Amber (amber-500)
          textColorClass = "text-amber-500 dark:text-amber-400";
        }

        if (circleRef.current) {
          circleRef.current.style.stroke = strokeColor;
        }

        if (textRef.current) {
          textRef.current.className = `text-sm md:text-base lg:text-lg font-black tracking-tight ${textColorClass}`;
        }

        // Handle low time warnings (under 25% time left)
        if (progress <= 0.25 && !timerFrozen) {
          if (containerRef.current) {
            containerRef.current.classList.add("animate-pulse");
          }
        } else {
          if (containerRef.current) {
            containerRef.current.classList.remove("animate-pulse");
          }
        }
      }

      // Check timeout
      if (timeLeftMs <= 0) {
        if (!hasTriggeredTimeOutRef.current) {
          hasTriggeredTimeOutRef.current = true;
          onTimeOut();
        }
        // Force display 0 and empty progress
        if (textRef.current) textRef.current.textContent = "0:00";
        if (circleRef.current) circleRef.current.style.strokeDashoffset = String(circumference);
        return;
      }

      // Continue the animation loop
      rafRef.current = requestAnimationFrame(tick);
    };

    // 3. Start the loop
    rafRef.current = requestAnimationFrame(tick);

    // 4. Cleanup on unmount or prop change
    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
      }
    };
  }, [questionId, timerMax, timerFrozen, isAnswered, circumference, onTimeOut, timeLeftRef]);

  return (
    <div
      ref={containerRef}
      className="relative w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 transition-all duration-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.15)] dark:drop-shadow-[0_4px_8px_rgba(0,0,0,0.3)]"
    >
      <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full select-none pointer-events-none"
      >
        {/* Outer Circular Casing Border (Clean Outline) */}
        <circle
          cx="50"
          cy="50"
          r="46"
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="3.5"
          className="text-zinc-50 dark:text-navy-blue stroke-zinc-900 dark:stroke-zinc-700"
        />

        {/* Dial Face Inner Background */}
        <circle
          cx="50"
          cy="50"
          r="42"
          fill="currentColor"
          className="text-white dark:text-zinc-950/90"
        />

        {/* Progress Background Track */}
        <circle
          cx="50"
          cy="50"
          r="38"
          stroke="currentColor"
          strokeWidth="5"
          className="text-zinc-100 dark:text-zinc-800"
        />

        {/* Circular Progress Ring */}
        <circle
          ref={circleRef}
          cx="50"
          cy="50"
          r="38"
          stroke="#06b6d4"
          strokeWidth="5.5"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset="0"
          transform="rotate(-90 50 50)"
          className="transition-all duration-75 ease-linear"
        />
      </svg>

      {/* Centered Time Remaining Text */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none select-none font-mono">
        <span
          ref={textRef}
          className="text-sm md:text-base lg:text-lg font-black text-cyan-600 dark:text-cyan-400 tracking-tight leading-none"
        >
          {formatTime(timerMax)}
        </span>
      </div>
    </div>
  );
}
