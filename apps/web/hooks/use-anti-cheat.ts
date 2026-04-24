"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRecordFocusEvent } from "@/lib/queries";
import { v4 as uuidv4 } from "uuid";

interface UseAntiCheatOptions {
  attemptId: string;
  isActive: boolean;
  isSubmitting: boolean;
  onAutoSubmitted: () => void;
}

export interface UseAntiCheatReturn {
  isFullScreen: boolean;
  enterFullScreen: () => Promise<void>;
  showViolationModal: boolean;
  violationType: string | null;
  dismissViolation: () => void;
  hasEnteredFirstTime: boolean;
}

export const VIOLATION_MESSAGES: Record<string, string> = {
  poll_loss_focus: "Mất tiêu điểm (có thể do chuyển tab hoặc mở ứng dụng khác đè lên).",
  exit_fullscreen: "Thoát chế độ toàn màn hình.",
  visibility_hidden: "Chuyển sang tab khác (ẩn cửa sổ bài thi).",
  window_blur: "Mất tiêu điểm cửa sổ (Alt+Tab hoặc click ra ngoài).",
  mouse_leave: "Rời chuột khỏi vùng làm bài.",
  timer_throttled: "Phát hiện tab bị ẩn (bypass extension detected).",
  devtools_detected: "Phát hiện mở công cụ Developer Tools.",
};

/**
 * Comprehensive anti-cheat hook for exam environment.
 *
 * Layers:
 * 1. Fullscreen enforcement + exit detection
 * 2. visibilitychange / blur / mouseleave listeners
 * 3. Heartbeat polling (document.hasFocus + fullscreen check)
 * 4. RAF-based timer throttle detection (defeats "Always Active Tab" extensions)
 * 5. DevTools detection (window dimension diff)
 * 6. Keyboard shortcut blocking (F12, Ctrl+Shift+I/J/C, Ctrl+U)
 * 7. Copy / cut / right-click protection
 */
export function useAntiCheat({
  attemptId,
  isActive,
  isSubmitting,
  onAutoSubmitted,
}: UseAntiCheatOptions): UseAntiCheatReturn {
  const recordFocusEvent = useRecordFocusEvent();

  const [isFullScreen, setIsFullScreen] = useState(false);
  const [violationType, setViolationType] = useState<string | null>(null);
  const [showViolationModal, setShowViolationModal] = useState(false);
  const [hasEnteredFirstTime, setHasEnteredFirstTime] = useState(false);
  const [stabilizedAt, setStabilizedAt] = useState<number | null>(null);

  const isViolatingRef = useRef(false);
  const isSubmittingRef = useRef(isSubmitting);
  const hasEnteredRef = useRef(false);
  const stabilizedAtRef = useRef<number | null>(null);

  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { hasEnteredRef.current = hasEnteredFirstTime; }, [hasEnteredFirstTime]);
  useEffect(() => { stabilizedAtRef.current = stabilizedAt; }, [stabilizedAt]);

  const enterFullScreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setHasEnteredFirstTime(true);
        setStabilizedAt(Date.now());
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  }, []);

  const dismissViolation = useCallback(() => {
    setShowViolationModal(false);
    isViolatingRef.current = false;
    enterFullScreen();
  }, [enterFullScreen]);

  // ─── Core violation handler ───
  const handleViolation = useCallback(
    (eventType: string) => {
      if (!hasEnteredRef.current || !stabilizedAtRef.current) return;
      if (Date.now() - stabilizedAtRef.current < 3000) return;
      if (isViolatingRef.current || isSubmittingRef.current) return;

      isViolatingRef.current = true;
      setViolationType(eventType);
      setShowViolationModal(true);

      recordFocusEvent.mutate(
        { attemptId, event: eventType, clientEventId: uuidv4() },
        {
          onSuccess: (res) => {
            if (res.action === "AUTO_SUBMITTED") {
              onAutoSubmitted();
            }
          },
        }
      );
    },
    [attemptId, recordFocusEvent, onAutoSubmitted]
  );

  // ─── Layer 1-3: Fullscreen, visibility, blur, mouseleave, heartbeat ───
  useEffect(() => {
    if (!isActive) return;

    const onFullScreenChange = () => {
      const active = !!document.fullscreenElement;
      setIsFullScreen(active);
      if (active) {
        setHasEnteredFirstTime(true);
        setStabilizedAt(Date.now());
      }
      if (!active && !isSubmittingRef.current && hasEnteredRef.current) {
        handleViolation("exit_fullscreen");
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden" && hasEnteredRef.current) {
        handleViolation("visibility_hidden");
      }
    };

    const onBlur = () => {
      if (hasEnteredRef.current) handleViolation("window_blur");
    };

    const onMouseLeave = () => {
      if (hasEnteredRef.current) handleViolation("mouse_leave");
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseleave", onMouseLeave);

    // Heartbeat polling (500ms)
    const heartbeat = setInterval(() => {
      if (isSubmittingRef.current || !hasEnteredRef.current) return;
      if (!document.hasFocus()) handleViolation("poll_loss_focus");
      if (!document.fullscreenElement && hasEnteredRef.current) {
        setIsFullScreen(false);
        handleViolation("exit_fullscreen");
      }
    }, 500);

    return () => {
      document.removeEventListener("fullscreenchange", onFullScreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("mouseleave", onMouseLeave);
      clearInterval(heartbeat);
    };
  }, [isActive, handleViolation]);

  // ─── Layer 4: RAF-based timer throttle detection ───
  // Chrome throttles RAF in hidden tabs. Extensions can fake visibilityState
  // but CANNOT prevent browser-level RAF throttling.
  // Normal: ~16ms between frames. Hidden/throttled: RAF paused or > 500ms.
  useEffect(() => {
    if (!isActive) return;

    let rafId: number;
    let lastFrameTime = 0;
    let wasThrottled = false;

    const checkFrame = (timestamp: number) => {
      if (lastFrameTime > 0 && hasEnteredRef.current && !isSubmittingRef.current) {
        const delta = timestamp - lastFrameTime;

        // If delta > 500ms, tab was likely hidden (RAF was paused).
        // Normal visible tab: ~16ms. Background tab: RAF paused entirely.
        // When tab returns, first frame has a huge delta.
        if (delta > 500 && !wasThrottled) {
          wasThrottled = true;
          handleViolation("timer_throttled");
        } else if (delta < 100) {
          wasThrottled = false;
        }
      }
      lastFrameTime = timestamp;
      rafId = requestAnimationFrame(checkFrame);
    };

    rafId = requestAnimationFrame(checkFrame);
    return () => cancelAnimationFrame(rafId);
  }, [isActive, handleViolation]);

  // ─── Layer 5: DevTools detection ───
  // In fullscreen, outerWidth == innerWidth normally.
  // If DevTools is docked, innerWidth shrinks → diff > threshold.
  useEffect(() => {
    if (!isActive) return;

    const THRESHOLD = 160;
    let devtoolsWasOpen = false;

    const check = setInterval(() => {
      if (!hasEnteredRef.current || isSubmittingRef.current) return;

      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      const isOpen = widthDiff > THRESHOLD || heightDiff > THRESHOLD;

      if (isOpen && !devtoolsWasOpen) {
        devtoolsWasOpen = true;
        handleViolation("devtools_detected");
      } else if (!isOpen) {
        devtoolsWasOpen = false;
      }
    }, 2000);

    return () => clearInterval(check);
  }, [isActive, handleViolation]);

  // ─── Layer 6: Keyboard shortcut blocking ───
  useEffect(() => {
    if (!isActive) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+Shift+I/J/C (DevTools)
      if (e.ctrlKey && e.shiftKey && ["I", "J", "C"].includes(e.key.toUpperCase())) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+U (view source)
      if (e.ctrlKey && e.key.toUpperCase() === "U") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+S (save page)
      if (e.ctrlKey && e.key.toUpperCase() === "S") {
        e.preventDefault();
        return;
      }
      // Ctrl+P (print)
      if (e.ctrlKey && e.key.toUpperCase() === "P") {
        e.preventDefault();
        return;
      }
    };

    document.addEventListener("keydown", onKeyDown, true);
    return () => document.removeEventListener("keydown", onKeyDown, true);
  }, [isActive]);

  // ─── Layer 7: Copy / cut / right-click / drag protection ───
  useEffect(() => {
    if (!isActive) return;

    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener("contextmenu", prevent);
    document.addEventListener("copy", prevent);
    document.addEventListener("cut", prevent);
    document.addEventListener("dragstart", prevent);
    document.addEventListener("selectstart", prevent);

    return () => {
      document.removeEventListener("contextmenu", prevent);
      document.removeEventListener("copy", prevent);
      document.removeEventListener("cut", prevent);
      document.removeEventListener("dragstart", prevent);
      document.removeEventListener("selectstart", prevent);
    };
  }, [isActive]);

  return {
    isFullScreen,
    enterFullScreen,
    showViolationModal,
    violationType,
    dismissViolation,
    hasEnteredFirstTime,
  };
}
