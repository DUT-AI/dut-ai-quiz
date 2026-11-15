"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { PoseEngine } from "../contracts";
import {
  createMotionController,
  type MotionState,
} from "./motion-controller";

interface UseMotionControllerOptions {
  engine: PoseEngine | null;
  enabled: boolean;
  canAnswer: boolean;

  // Distinguish separate sessions, even if question IDs repeat.
  sessionId: string | null;
  questionId: string | null;
  optionIds: readonly string[];
  blockedOptionIds?: readonly string[];
  onConfirm: (optionId: string) => void;
}

const EMPTY_STATE: MotionState = {
  mapping: null,
  active: false,
  candidateOptionId: null,
  confirmedOptionId: null,
  holdProgress: 0,
};

type Controller = ReturnType<typeof createMotionController>;

interface ControllerEntry {
  key: string;
  controller: Controller;
  generation: number;
}

export function useMotionController({
  engine,
  enabled,
  canAnswer,
  sessionId,
  questionId,
  optionIds,
  blockedOptionIds = [],
  onConfirm,
}: UseMotionControllerOptions) {
  // Compare values rather than the identity of the optionIds array.
  const questionKey = JSON.stringify([
    sessionId,
    questionId,
    optionIds,
  ]);

  const entryRef = useRef<ControllerEntry | null>(null);

  const [snapshot, setSnapshot] = useState<{
    key: string;
    state: MotionState;
  } | null>(null);

  const [failure, setFailure] = useState<{
    key: string;
    message: string;
  } | null>(null);

  const latestRef = useRef({
    engine,
    questionKey,
    enabled,
    canAnswer,
    blockedOptionIds,
    onConfirm,
  });

  // Update guards before browser events can use old render values.
  useLayoutEffect(() => {
    latestRef.current = {
      engine,
      questionKey,
      enabled,
      canAnswer,
      blockedOptionIds,
      onConfirm,
    };
  }, [engine, questionKey, enabled, canAnswer, onConfirm]);

  useEffect(() => {
    const [currentSessionId, currentQuestionId, currentOptionIds] =
      JSON.parse(questionKey) as [
        string | null,
        string | null,
        string[],
      ];

    if (!currentSessionId || !currentQuestionId) {
      entryRef.current = null;
      return;
    }

    let entry = entryRef.current;

    try {
      if (!entry || entry.key !== questionKey) {
        const controller = createMotionController({
          rng: Math.random,
          minConfidence: 0.7,
          maxFrameGapMs: 250,
        });

        const generation = controller.selectQuestion(
          currentQuestionId,
          currentOptionIds,
          performance.now(),
        );

        entry = {
          key: questionKey,
          controller,
          generation,
        };

        entryRef.current = entry;
      }
    } catch (cause: unknown) {
      entryRef.current = null;
      setFailure({
        key: questionKey,
        message:
          cause instanceof Error
            ? cause.message
            : "Could not prepare motion controls.",
      });
      return;
    }

    const { controller, generation } = entry;
    let disposed = false;
    let failed = false;

    function isCurrent(): boolean {
      const latest = latestRef.current;

      return (
        !disposed &&
        !failed &&
        latest.engine === engine &&
        latest.questionKey === questionKey &&
        latest.enabled &&
        latest.canAnswer
      );
    }

    function publish(): void {
      if (!disposed) {
        setSnapshot({
          key: questionKey,
          state: controller.getState(),
        });
      }
    }

    function fail(cause: unknown): void {
      failed = true;
      controller.setActive(false, performance.now());
      publish();

      if (!disposed) {
        setFailure({
          key: questionKey,
          message:
            cause instanceof Error
              ? cause.message
              : "Motion input failed.",
        });
      }
    }

    setFailure(null);

    controller.setActive(
      enabled && canAnswer && engine?.cameraStatus === "ready",
      performance.now(),
    );
    publish();

    if (!engine || !enabled || !canAnswer) {
      return;
    }

    const unsubscribeFrames = engine.subscribe((event) => {
      if (!isCurrent()) return;

      try {
        const confirmation = controller.processFrame(
          event.payload.frame,
          generation,
          latestRef.current.blockedOptionIds,
        );

        publish();

        if (confirmation && isCurrent()) {
          // The controller is already locked before this callback.
          latestRef.current.onConfirm(confirmation.optionId);
        }
      } catch (cause: unknown) {
        fail(cause);
      }
    });

    const unsubscribeCamera = engine.subscribeCameraStatus((status) => {
      if (!isCurrent()) return;

      controller.setActive(status === "ready", performance.now());
      publish();
    });

    const interval = window.setInterval(() => {
      if (!isCurrent()) return;

      const previous = controller.getState();
      controller.checkTimeout(performance.now());

      if (controller.getState() !== previous) {
        publish();
      }
    }, 50);

    return () => {
      disposed = true;
      window.clearInterval(interval);
      unsubscribeFrames();
      unsubscribeCamera();
      controller.setActive(false, performance.now());
    };
  }, [engine, enabled, canAnswer, questionKey]);

  const currentFailure =
    failure?.key === questionKey ? failure.message : null;

  const currentState =
    snapshot?.key === questionKey && !currentFailure
      ? snapshot.state
      : EMPTY_STATE;

  return {
    ...currentState,
    error: currentFailure,
  };
}