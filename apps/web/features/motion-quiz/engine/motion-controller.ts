import type {
  MotionFeedback,
  OptionActionMapping,
  PoseFrameResult,
} from "../contracts";
import { createRandomQuestionConfig } from "./action-randomizer";
import { createHoldDetector } from "./hold-detector";

interface MotionControllerOptions {
  readonly rng: () => number;
  readonly minConfidence: number;
  readonly maxFrameGapMs: number;
}

export interface MotionConfirmation {
  readonly questionId: string;
  readonly optionId: string;
  readonly generation: number;
}

export interface MotionState extends MotionFeedback {
  readonly mapping: OptionActionMapping | null;
  readonly active: boolean;
}

export function createMotionController({
  rng,
  minConfidence,
  maxFrameGapMs,
}: MotionControllerOptions) {
  if (
    !Number.isFinite(minConfidence) ||
    minConfidence < 0 ||
    minConfidence > 1
  ) {
    throw new Error("Confidence threshold must be in [0, 1].");
  }

  const detector = createHoldDetector({ maxFrameGapMs });

  let generation = 0;
  let startedAtMs = 0;
  let lastTimestampMs: number | null = null;

  let state: MotionState = {
    mapping: null,
    active: false,
    candidateOptionId: null,
    confirmedOptionId: null,
    holdProgress: 0,
  };

  function validateTimestamp(timestampMs: number): void {
    if (!Number.isFinite(timestampMs) || timestampMs < 0) {
      throw new Error("Timestamp must be finite and nonnegative.");
    }
  }

  function getState(): MotionState {
    return state;
  }

  function selectQuestion(
    questionId: string,
    optionIds: readonly string[],
    timestampMs: number,
  ): number {
    validateTimestamp(timestampMs);

    const mapping = createRandomQuestionConfig(questionId, optionIds, rng);

    generation += 1;
    startedAtMs = timestampMs;
    lastTimestampMs = null;
    detector.reset();

    state = {
      mapping,
      active: false,
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
    };

    return generation;
  }

  // Call when gesture mode or the game's ability to answer changes.
  function setActive(active: boolean, timestampMs: number): void {
    validateTimestamp(timestampMs);

    const nextActive =
      active &&
      state.mapping !== null &&
      state.confirmedOptionId === null;

    if (nextActive === state.active) return;

    detector.reset();
    lastTimestampMs = null;
    startedAtMs = timestampMs;

    state = {
      ...state,
      active: nextActive,
      candidateOptionId: null,
      holdProgress: 0,
    };
  }

  function processFrame(
    frame: PoseFrameResult,
    frameGeneration: number,
  ): MotionConfirmation | null {
    if (
      frameGeneration !== generation ||
      !state.active ||
      state.mapping === null
    ) {
      return null;
    }

    validateTimestamp(frame.timestampMs);

    if (
      frame.timestampMs < startedAtMs ||
      (lastTimestampMs !== null &&
        frame.timestampMs <= lastTimestampMs)
    ) {
      return null;
    }

    lastTimestampMs = frame.timestampMs;

    const validAction =
      frame.trackingStatus === "tracking" &&
      Number.isFinite(frame.confidence) &&
      frame.confidence >= minConfidence &&
      frame.confidence <= 1
        ? frame.detectedAction
        : null;

    const optionId =
      validAction === null
        ? null
        : (Object.entries(state.mapping.optionMap).find(
            ([, actionId]) => actionId === validAction,
          )?.[0] ?? null);

    const hold = detector.update(optionId, frame.timestampMs);

    state = {
      ...state,
      candidateOptionId: hold.candidateOptionId,
      confirmedOptionId: hold.confirmedOptionId,
      holdProgress: hold.holdProgress,
    };

    if (!hold.justConfirmed || hold.confirmedOptionId === null) {
      return null;
    }

    // Lock synchronously before returning a submit command.
    state = { ...state, active: false };

    return {
      questionId: state.mapping!.questionId,
      optionId: hold.confirmedOptionId,
      generation,
    };
  }

  // An external scheduler calls this even when no camera frames arrive.
  function checkTimeout(timestampMs: number): void {
    validateTimestamp(timestampMs);

    if (
      !state.active ||
      lastTimestampMs === null ||
      state.candidateOptionId === null ||
      timestampMs - lastTimestampMs <= maxFrameGapMs
    ) {
      return;
    }

    detector.update(null, timestampMs);
    lastTimestampMs = timestampMs;

    state = {
      ...state,
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
    };
  }

  return {
    getState,
    selectQuestion,
    setActive,
    processFrame,
    checkTimeout,
  };
}