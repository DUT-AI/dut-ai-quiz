import { test, expect } from "@playwright/test";
import { createElement } from "react";
import {
  act,
  create,
  type ReactTestRenderer,
} from "react-test-renderer";
import type {
  ActionId,
  CameraStatus,
  PoseEngine,
  PoseUpdatedEvent,
} from "../contracts";
import { useMotionController } from "./use-motion-controller";

type HookOptions = Parameters<typeof useMotionController>[0];
type HookState = ReturnType<typeof useMotionController>;

function createMockEngine() {
  const frameListeners = new Set<(event: PoseUpdatedEvent) => void>();
  const cameraListeners = new Set<(status: CameraStatus) => void>();

  let cameraStatus: CameraStatus = "ready";

  const engine: PoseEngine = {
    provider: "test",
    status: "running",

    get cameraStatus() {
      return cameraStatus;
    },

    initialize: async () => {},
    getMediaStream: () => null,
    attachVideo: () => {},
    start: () => {},
    stop: () => {},
    dispose: () => {},

    subscribe(listener) {
      frameListeners.add(listener);
      return () => {
        frameListeners.delete(listener);
      };
    },

    subscribeCameraStatus(listener) {
      cameraListeners.add(listener);
      return () => {
        cameraListeners.delete(listener);
      };
    },
  };

  return {
    engine,

    emit(timestampMs: number, actionId: ActionId) {
      const event: PoseUpdatedEvent = {
        type: "POSE_UPDATED",
        timestampMs,
        payload: {
          frame: {
            timestampMs,
            detectedAction: actionId,
            confidence: 1,
            trackingStatus: "tracking",
            landmarks: [],
          },
        },
      };

      for (const listener of Array.from(frameListeners)) {
        listener(event);
      }
    },

    setCameraStatus(status: CameraStatus) {
      cameraStatus = status;
      for (const listener of Array.from(cameraListeners)) {
        listener(status);
      }
    },

    listenerCount() {
      return frameListeners.size + cameraListeners.size;
    },
  };
}

let renderer: ReactTestRenderer | null = null;
let clock = 0;
let timerId = 0;
let timers: Map<number, () => void>;

let originalWindow: PropertyDescriptor | undefined;
let originalNow: PropertyDescriptor | undefined;

test.beforeEach(() => {
  clock = 0;
  timerId = 0;
  timers = new Map();

  originalWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  originalNow = Object.getOwnPropertyDescriptor(performance, "now");

  // Only the browser APIs used by this hook are needed.
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {
      setInterval(callback: () => void) {
        const id = ++timerId;
        timers.set(id, callback);
        return id;
      },

      clearInterval(id: number) {
        timers.delete(id);
      },
    },
  });

  Object.defineProperty(performance, "now", {
    configurable: true,
    value: () => clock,
  });
});

test.afterEach(() => {
  try {
    if (renderer) {
      act(() => renderer?.unmount());
    }
  } finally {
    renderer = null;

    if (originalWindow) {
      Object.defineProperty(globalThis, "window", originalWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }

    if (originalNow) {
      Object.defineProperty(performance, "now", originalNow);
    } else {
      Reflect.deleteProperty(performance, "now");
    }
  }
});

function setup() {
  const mock = createMockEngine();
  const confirmed: string[] = [];
  let latest!: HookState;

  let props: HookOptions = {
    engine: mock.engine,
    enabled: true,
    canAnswer: true,
    sessionId: "session-one",
    questionId: "question-one",
    optionIds: ["one", "two", "three", "four"],
    onConfirm: (optionId) => confirmed.push(optionId),
  };

  function Harness(options: HookOptions) {
    latest = useMotionController(options);
    return null;
  }

  act(() => {
    renderer = create(createElement(Harness, props));
  });

  function actionForFirstOption(): ActionId {
    const action = latest.mapping?.optionMap["one"];
    if (!action) throw new Error("Missing action mapping.");
    return action;
  }

  return {
    mock,
    confirmed,
    state: () => latest,
    actionForFirstOption,

    update(patch: Partial<HookOptions>) {
      props = { ...props, ...patch };

      act(() => {
        renderer?.update(createElement(Harness, props));
      });
    },

    emit(time: number, action = actionForFirstOption()) {
      clock = time;
      act(() => mock.emit(time, action));
    },

    tick(time: number) {
      clock = time;

      act(() => {
        for (const callback of Array.from(timers.values())) {
          callback();
        }
      });
    },
  };
}

test.describe("useMotionController", () => {
  test("publishes progress and confirms exactly once", () => {
    const app = setup();

    for (let time = 0; time < 1500; time += 250) {
      app.emit(time);
    }

    expect(app.confirmed).toEqual([]);
    expect(app.state().holdProgress).toBeGreaterThan(0);

    app.emit(1500);

    expect(app.confirmed).toEqual(["one"]);
    expect(app.state().confirmedOptionId).toBe("one");
    expect(app.state().holdProgress).toBe(1);

    app.emit(1750);
    expect(app.confirmed).toEqual(["one"]);
  });

  test("disabling answers clears progress and removes subscriptions", () => {
    const app = setup();

    app.emit(0);
    app.emit(250);

    const mapping = app.state().mapping;

    app.update({ canAnswer: false });

    expect(app.state().active).toBe(false);
    expect(app.state().holdProgress).toBe(0);
    expect(app.mock.listenerCount()).toBe(0);
    expect(timers.size).toBe(0);

    app.emit(1500);
    expect(app.confirmed).toEqual([]);

    app.update({ canAnswer: true });

    expect(app.state().mapping).toBe(mapping);
    expect(app.mock.listenerCount()).toBe(2);
    expect(timers.size).toBe(1);
  });

  test("changing questions resets progress and requires a fresh hold", () => {
    const app = setup();

    app.emit(0);
    app.emit(250);

    app.update({ questionId: "question-two" });

    expect(app.state().mapping?.questionId).toBe("question-two");
    expect(app.state().holdProgress).toBe(0);
    expect(app.state().confirmedOptionId).toBeNull();

    app.emit(500);
    app.emit(750);

    expect(app.confirmed).toEqual([]);
    expect(app.state().holdProgress).toBeCloseTo(250 / 1500);
  });

  test("resets on frame timeout and camera disconnection", () => {
    const app = setup();

    app.emit(0);
    app.emit(250);

    app.tick(501);

    expect(app.state().holdProgress).toBe(0);
    expect(app.state().candidateOptionId).toBeNull();

    app.emit(600);
    app.emit(850);

    act(() => app.mock.setCameraStatus("stopped"));

    expect(app.state().active).toBe(false);
    expect(app.state().holdProgress).toBe(0);

    app.emit(1000);
    expect(app.confirmed).toEqual([]);

    act(() => app.mock.setCameraStatus("ready"));
    app.emit(1100);

    expect(app.state().active).toBe(true);
    expect(app.state().holdProgress).toBe(0);
  });

  test("cleans up listeners and timers when unmounted", () => {
    const app = setup();

    expect(app.mock.listenerCount()).toBe(2);
    expect(timers.size).toBe(1);

    act(() => renderer?.unmount());
    renderer = null;

    expect(app.mock.listenerCount()).toBe(0);
    expect(timers.size).toBe(0);

    app.emit(2000);
    expect(app.confirmed).toEqual([]);
  });
});