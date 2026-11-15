import { test, expect } from "@playwright/test";
import { createHoldDetector } from "./hold-detector";

function createDetector() {
  return createHoldDetector({ maxFrameGapMs: 250 });
}

test.describe("motion hold detector", () => {
  test("confirms only after a continuous 1500 ms hold", () => {
    const detector = createDetector();

    for (let time = 0; time <= 1250; time += 250) {
      const result = detector.update("option-one", time);

      expect(result.confirmedOptionId).toBeNull();
      expect(result.justConfirmed).toBe(false);
    }

    const before = detector.update("option-one", 1499);
    expect(before.holdProgress).toBeCloseTo(1499 / 1500);
    expect(before.justConfirmed).toBe(false);

    expect(detector.update("option-one", 1500)).toEqual({
      candidateOptionId: "option-one",
      confirmedOptionId: "option-one",
      holdProgress: 1,
      justConfirmed: true,
    });
  });

  test("resets progress when the candidate changes", () => {
    const detector = createDetector();

    detector.update("option-one", 0);
    detector.update("option-one", 250);

    expect(detector.update("option-two", 500)).toEqual({
      candidateOptionId: "option-two",
      confirmedOptionId: null,
      holdProgress: 0,
      justConfirmed: false,
    });
  });

  test("resets progress on tracking loss", () => {
    const detector = createDetector();

    detector.update("option-one", 0);
    detector.update("option-one", 250);

    expect(detector.update(null, 500)).toEqual({
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
      justConfirmed: false,
    });

    expect(detector.update("option-one", 750).holdProgress).toBe(0);
  });

  test("starts over when the frame gap exceeds the limit", () => {
    const detector = createDetector();

    detector.update("option-one", 0);

    // Exactly 250 ms is still allowed.
    expect(
      detector.update("option-one", 250).holdProgress,
    ).toBeGreaterThan(0);

    // A gap of 251 ms must restart the hold.
    expect(detector.update("option-one", 501)).toEqual({
      candidateOptionId: "option-one",
      confirmedOptionId: null,
      holdProgress: 0,
      justConfirmed: false,
    });
  });

  test("ignores old and duplicate frames", () => {
    const detector = createDetector();

    detector.update("option-one", 0);
    const current = detector.update("option-one", 250);

    expect(detector.update(null, 100)).toEqual(current);
    expect(detector.update("option-two", 250)).toEqual(current);
  });

  test("confirms once and stays locked until reset", () => {
    const detector = createDetector();

    for (let time = 0; time <= 1500; time += 250) {
      detector.update("option-one", time);
    }

    const next = detector.update("option-one", 1750);
    expect(next.justConfirmed).toBe(false);
    expect(next.confirmedOptionId).toBe("option-one");

    const changed = detector.update("option-two", 2000);
    expect(changed.justConfirmed).toBe(false);
    expect(changed.confirmedOptionId).toBe("option-one");

    detector.reset();

    expect(detector.update("option-two", 2250)).toEqual({
      candidateOptionId: "option-two",
      confirmedOptionId: null,
      holdProgress: 0,
      justConfirmed: false,
    });
  });

  test("rejects invalid timestamps and blank option IDs", () => {
    const detector = createDetector();

    for (const timestamp of [-1, NaN, Infinity]) {
      expect(() =>
        detector.update("option-one", timestamp),
      ).toThrow("Timestamp must be finite and nonnegative.");
    }

    expect(() => detector.update(" ", 0)).toThrow(
      "Option ID must not be blank.",
    );
  });

  test("rejects invalid timing configuration", () => {
    for (const value of [0, -1, NaN, Infinity]) {
      expect(() =>
        createHoldDetector({ maxFrameGapMs: value }),
      ).toThrow();

      expect(() =>
        createHoldDetector({
          holdDurationMs: value,
          maxFrameGapMs: 250,
        }),
      ).toThrow();
    }
  });
});