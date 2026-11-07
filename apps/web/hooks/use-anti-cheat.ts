"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRecordFocusEvent } from "@/lib/queries";
import { v4 as uuidv4 } from "uuid";

interface UseAntiCheatOptions {
  attemptId?: string;
  isActive: boolean;
  isSubmitting: boolean;
  onAutoSubmitted?: () => void;
}

export interface UseAntiCheatReturn {
  isFullScreen: boolean;
  enterFullScreen: () => Promise<void>;
  showViolationModal: boolean;
  violationType: string | null;
  dismissViolation: () => void;
  hasEnteredFirstTime: boolean;
  violationCount: number;
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

const RELOAD_GRACE_PREFIX = "exam_reload_grace_";
const RELOAD_GRACE_WINDOW_MS = 10000; // 10 seconds grace period on reload

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
  const [violationCount, setViolationCount] = useState(0);

  const isViolatingRef = useRef(false);
  const isSubmittingRef = useRef(isSubmitting);
  const hasEnteredRef = useRef(false);
  const stabilizedAtRef = useRef<number | null>(null);
  const mouseLeaveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isUnloadingRef = useRef(false);

  useEffect(() => { isSubmittingRef.current = isSubmitting; }, [isSubmitting]);
  useEffect(() => { hasEnteredRef.current = hasEnteredFirstTime; }, [hasEnteredFirstTime]);
  useEffect(() => { stabilizedAtRef.current = stabilizedAt; }, [stabilizedAt]);

  // Handle page reload grace period to prevent false-positive anti-cheat penalties
  useEffect(() => {
    if (typeof window === "undefined" || !attemptId) return;

    // Check if this mount is immediately following a page reload
    const key = `${RELOAD_GRACE_PREFIX}${attemptId}`;
    try {
      const graceTimestamp = sessionStorage.getItem(key);
      if (graceTimestamp) {
        const diff = Date.now() - parseInt(graceTimestamp, 10);
        if (diff < RELOAD_GRACE_WINDOW_MS) {
          // Provide 5s cooldown for the reloaded page to re-render without trigger
          const cooldown = Date.now() + 5000;
          setStabilizedAt(cooldown);
          stabilizedAtRef.current = cooldown;
        }
        sessionStorage.removeItem(key);
      }
    } catch {
      // ignore sessionStorage access errors
    }

    const onBeforeUnload = () => {
      isUnloadingRef.current = true;
      try {
        sessionStorage.setItem(key, String(Date.now()));
      } catch {
        // ignore
      }
    };

    window.addEventListener("beforeunload", onBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
    };
  }, [attemptId]);

  const enterFullScreen = useCallback(async () => {
    try {
      const el = document.documentElement;
      if (el.requestFullscreen) {
        await el.requestFullscreen();
        setHasEnteredFirstTime(true);
        const cooldown = Date.now() + 3000;
        setStabilizedAt(cooldown);
        stabilizedAtRef.current = cooldown;
      }
    } catch (err) {
      console.error("Fullscreen failed:", err);
    }
  }, []);

  const dismissViolation = useCallback(async () => {
    setShowViolationModal(false);
    const cooldown = Date.now() + 3000;
    setStabilizedAt(cooldown);
    stabilizedAtRef.current = cooldown;
    await enterFullScreen();
    isViolatingRef.current = false;
  }, [enterFullScreen]);

  // ─── Core violation handler ───
  const handleViolation = useCallback(
    (eventType: string) => {
      // Suppress if unloading, not ready, or within cooldown
      if (isUnloadingRef.current) return;
      if (!hasEnteredRef.current || !stabilizedAtRef.current) return;
      if (Date.now() < stabilizedAtRef.current) return;
      if (isViolatingRef.current || isSubmittingRef.current) return;

      isViolatingRef.current = true;
      setViolationType(eventType);
      setShowViolationModal(true);

      if (attemptId) {
        recordFocusEvent.mutate(
          { attemptId, event: eventType, clientEventId: uuidv4() },
          {
            onSuccess: (res) => {
              if (res.action === "AUTO_SUBMITTED" && onAutoSubmitted) {
                onAutoSubmitted();
              }
            },
          }
        );
      } else {
        setViolationCount((prev) => {
          const next = prev + 1;
          if (next >= 3 && onAutoSubmitted) {
            onAutoSubmitted();
          }
          return next;
        });
      }
    },
    [attemptId, recordFocusEvent, onAutoSubmitted]
  );

  // ─── Layer 1-3: Fullscreen, visibility, blur, mouseleave, heartbeat ───
  useEffect(() => {
    if (!isActive) return;

    const onFullScreenChange = () => {
      if (isUnloadingRef.current) return;
      const active = !!document.fullscreenElement;
      setIsFullScreen(active);
      if (active) {
        setHasEnteredFirstTime(true);
        const cooldown = Date.now() + 3000;
        setStabilizedAt(cooldown);
        stabilizedAtRef.current = cooldown;
      }
      if (!active && !isSubmittingRef.current && hasEnteredRef.current) {
        handleViolation("exit_fullscreen");
      }
    };

    const onVisibilityChange = () => {
      if (isUnloadingRef.current) return;
      if (document.visibilityState === "hidden" && hasEnteredRef.current) {
        handleViolation("visibility_hidden");
      }
    };

    const onBlur = () => {
      if (isUnloadingRef.current) return;
      if (hasEnteredRef.current) handleViolation("window_blur");
    };

    const onMouseLeave = () => {
      if (isUnloadingRef.current || !hasEnteredRef.current) return;
      if (mouseLeaveTimerRef.current) clearTimeout(mouseLeaveTimerRef.current);
      mouseLeaveTimerRef.current = setTimeout(() => {
        if (!isUnloadingRef.current) {
          handleViolation("mouse_leave");
        }
        mouseLeaveTimerRef.current = null;
      }, 2000);
    };

    const onMouseEnter = () => {
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current);
        mouseLeaveTimerRef.current = null;
      }
    };

    document.addEventListener("fullscreenchange", onFullScreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onBlur);
    document.addEventListener("mouseleave", onMouseLeave);
    document.addEventListener("mouseenter", onMouseEnter);

    // Heartbeat polling (500ms)
    const heartbeat = setInterval(() => {
      if (isUnloadingRef.current || isSubmittingRef.current || !hasEnteredRef.current) return;
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
      document.removeEventListener("mouseenter", onMouseEnter);
      if (mouseLeaveTimerRef.current) {
        clearTimeout(mouseLeaveTimerRef.current);
        mouseLeaveTimerRef.current = null;
      }
      clearInterval(heartbeat);
    };
  }, [isActive, handleViolation]);

  // ─── Layer 4: RAF-based timer throttle detection ───
  useEffect(() => {
    if (!isActive) return;

    let rafId: number;
    let lastFrameTime = 0;
    let wasThrottled = false;

    const checkFrame = (timestamp: number) => {
      if (isUnloadingRef.current) return;
      if (lastFrameTime > 0 && hasEnteredRef.current && !isSubmittingRef.current) {
        const delta = timestamp - lastFrameTime;

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
  useEffect(() => {
    if (!isActive) return;

    const THRESHOLD = 160;
    let devtoolsWasOpen = false;

    const check = setInterval(() => {
      if (isUnloadingRef.current || !hasEnteredRef.current || isSubmittingRef.current) return;

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
      const isCmdOrCtrl = e.ctrlKey || e.metaKey;
      const keyUpper = e.key.toUpperCase();

      // F12
      if (e.key === "F12") {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Mac Option+Cmd+I / Option+Cmd+J / Option+Cmd+C (DevTools)
      if (e.altKey && e.metaKey && ["I", "J", "C"].includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+Shift+I/J/C or Cmd+Shift+I/J/C (DevTools)
      if (isCmdOrCtrl && e.shiftKey && ["I", "J", "C"].includes(keyUpper)) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+U or Cmd+U (view source / Option+Cmd+U)
      if ((isCmdOrCtrl && keyUpper === "U") || (e.altKey && e.metaKey && keyUpper === "U")) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      // Ctrl+S or Cmd+S (save page)
      if (isCmdOrCtrl && keyUpper === "S") {
        e.preventDefault();
        return;
      }
      // Ctrl+P or Cmd+P (print)
      if (isCmdOrCtrl && keyUpper === "P") {
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
    violationCount,
  };
}
