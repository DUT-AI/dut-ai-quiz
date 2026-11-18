export const ACTION_IDS = [
  "ACT_01",
  "ACT_02",
  "ACT_03",
  "ACT_04",
  "ACT_05",
  "ACT_06",
  "ACT_07",
  "ACT_08",
] as const;

export type ActionId = (typeof ACTION_IDS)[number];

export type TrackingStatus = "tracking" | "lost" | "unavailable";

export interface PoseLandmark {
  readonly x: number;
  readonly y: number;
  readonly z: number;
  readonly visibility?: number;
  readonly presence?: number;
}

export interface PoseFrameResult {
  /** Milliseconds from the shared monotonic session clock. */
  readonly timestampMs: number;

  readonly detectedAction: ActionId | null;

  /** Match strength in [0, 1], not a calibrated probability. */
  readonly confidence: number;

  /**
   * MediaPipe landmark indices; preserve missing positions with null.
   * Coordinates belong to the unmirrored source image.
   */
  readonly landmarks: readonly PoseLandmark[];

  readonly trackingStatus: TrackingStatus;
}

export interface OptionActionMapping {
  readonly questionId: string;

  /** Actual option ID -> action ID; four distinct actions. */
  readonly optionMap: Readonly<Record<string, ActionId>>;
}

export type CameraStatus =
  | "idle"
  | "initializing"
  | "ready"
  | "permission-denied"
  | "not-found"
  | "error"
  | "stopped";
export interface CameraState {
  readonly status: CameraStatus;
  readonly error: string | null;
}

export interface MotionFeedback {
  readonly candidateOptionId: string | null;
  readonly confirmedOptionId: string | null;

  /** Normalized progress in [0, 1]. */
  readonly holdProgress: number;
}
export type PoseEngineStatus =
  | "new"
  | "ready"
  | "running"
  | "stopped"
  | "disposed";

export interface PoseUpdatedEvent {
  readonly type: "POSE_UPDATED";
  readonly timestampMs: number;
  readonly payload: {
    readonly frame: PoseFrameResult;
  };
}

export interface PoseEngine {
  readonly provider: string;
  readonly status: PoseEngineStatus;
  readonly cameraStatus: CameraStatus;

  initialize(): Promise<void>;

  /** Camera stream; null for mock input or before acquisition. */
  getMediaStream(): MediaStream | null;

  /** Use the video element owned by the UI for inference. */
  attachVideo(video: HTMLVideoElement): void;

  start(): void;

  /** Pause inference. The current real provider retains its stream. */
  stop(): void;

  /** Subscribe to future frames; returns an unsubscribe function. */
  subscribe(
    listener: (event: PoseUpdatedEvent) => void,
  ): () => void;

  /** Subscribe to camera status changes. */
  subscribeCameraStatus(
    listener: (status: CameraStatus) => void,
  ): () => void;

  /** Release camera/model resources and subscriptions. */
  dispose(): void;
}