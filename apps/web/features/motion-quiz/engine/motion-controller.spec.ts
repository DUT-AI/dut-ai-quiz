import { test, expect } from "@playwright/test";
import type { PoseFrameResult } from "../contracts";
import { createMotionController } from "./motion-controller";

const optionIds = ["option-one", "option-two", "option-three", "option-four"];

function setup() {
  const controller = createMotionController({
    rng: () => 0,
    minConfidence: 0.7,
    maxFrameGapMs: 250,
  });

  const generation = controller.selectQuestion(
    "question-one",
    optionIds,
    0,
  );

  controller.setActive(true, 0);

  return { controller, generation };
}

function frame(
  timestampMs: number,
  overrides: Partial<PoseFrameResult> = {},
): PoseFrameResult {
  return {
    timestampMs,
    detectedAction: "ACT_02",
    confidence: 1,
    trackingStatus: "tracking",
    landmarks: [],
    ...overrides,
  };
}

test.describe("motion controller", () => {
  test("confirms the mapped option once after 1500 ms", () => {
    const { controller, generation } = setup();

    for (let time = 0; time < 1500; time += 250) {
      expect(
        controller.processFrame(frame(time), generation),
      ).toBeNull();
    }

    expect(
      controller.processFrame(frame(1500), generation),
    ).toEqual({
      questionId: "question-one",
      optionId: "option-one",
      generation,
    });

    expect(controller.getState()).toMatchObject({
      active: false,
      confirmedOptionId: "option-one",
      holdProgress: 1,
    });

    expect(
      controller.processFrame(frame(1750), generation),
    ).toBeNull();

    // Bật lại cùng câu không được mở khóa đáp án đã chốt.
    controller.setActive(true, 1800);
    expect(controller.getState().active).toBe(false);
  });

  test("does not select an action outside the question mapping", () => {
    const { controller, generation } = setup();

    // Với rng = 0, mapping chỉ gồm ACT_02 đến ACT_05.
    controller.processFrame(
      frame(0, { detectedAction: "ACT_08" }),
      generation,
    );

    expect(controller.getState()).toMatchObject({
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
    });
  });

  test("resets when confidence is low or tracking is lost", () => {
    const { controller, generation } = setup();

    controller.processFrame(frame(0), generation);
    controller.processFrame(frame(250), generation);

    expect(controller.getState().holdProgress).toBeGreaterThan(0);

    controller.processFrame(
      frame(500, { confidence: 0.2 }),
      generation,
    );

    expect(controller.getState().holdProgress).toBe(0);
    expect(controller.getState().candidateOptionId).toBeNull();

    controller.processFrame(frame(750), generation);
    controller.processFrame(frame(1000), generation);

    controller.processFrame(
      frame(1250, {
        detectedAction: null,
        confidence: 0,
        trackingStatus: "lost",
      }),
      generation,
    );

    expect(controller.getState()).toMatchObject({
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
    });
  });

  test("disabling clears progress and prevents confirmation", () => {
    const { controller, generation } = setup();

    controller.processFrame(frame(0), generation);
    controller.processFrame(frame(250), generation);

    controller.setActive(false, 300);

    expect(controller.getState()).toMatchObject({
      active: false,
      candidateOptionId: null,
      holdProgress: 0,
    });

    expect(
      controller.processFrame(frame(1500), generation),
    ).toBeNull();

    controller.setActive(true, 1600);
    controller.processFrame(frame(1600), generation);

    expect(controller.getState().holdProgress).toBe(0);
  });

  test("question changes reset progress and reject old generations", () => {
    const { controller, generation } = setup();

    controller.processFrame(frame(0), generation);
    controller.processFrame(frame(250), generation);

    const nextGeneration = controller.selectQuestion(
      "question-two",
      optionIds,
      300,
    );
    controller.setActive(true, 300);

    expect(controller.getState()).toMatchObject({
      candidateOptionId: null,
      confirmedOptionId: null,
      holdProgress: 0,
    });

    expect(
      controller.processFrame(frame(500), generation),
    ).toBeNull();

    expect(controller.getState().candidateOptionId).toBeNull();

    controller.processFrame(frame(500), nextGeneration);

    expect(controller.getState().candidateOptionId).toBe("option-one");
    expect(controller.getState().holdProgress).toBe(0);
  });

  test("timeout clears progress and rejects delayed frames", () => {
    const { controller, generation } = setup();

    controller.processFrame(frame(0), generation);
    controller.processFrame(frame(250), generation);

    // Khoảng cách đúng 250 ms vẫn được phép.
    controller.checkTimeout(500);
    expect(controller.getState().holdProgress).toBeGreaterThan(0);

    controller.checkTimeout(501);
    expect(controller.getState()).toMatchObject({
      candidateOptionId: null,
      holdProgress: 0,
    });

    // Frame đến muộn không khôi phục tiến độ cũ.
    controller.processFrame(frame(400), generation);
    expect(controller.getState().candidateOptionId).toBeNull();

    controller.processFrame(frame(550), generation);
    expect(controller.getState().holdProgress).toBe(0);
  });

  test("keeps mapping stable during frames and mode changes", () => {
    const { controller, generation } = setup();
    const mapping = controller.getState().mapping;

    controller.processFrame(frame(0), generation);
    controller.processFrame(frame(250), generation);
    controller.setActive(false, 300);
    controller.setActive(true, 400);

    expect(controller.getState().mapping).toBe(mapping);
  });

  test("rejects frames captured before activation", () => {
    const { controller, generation } = setup();

    controller.setActive(false, 100);
    controller.setActive(true, 1000);

    controller.processFrame(frame(900), generation);

    expect(controller.getState().candidateOptionId).toBeNull();

    controller.processFrame(frame(1000), generation);

    expect(controller.getState().candidateOptionId).toBe("option-one");
    expect(controller.getState().holdProgress).toBe(0);
  });
});
test("blocks eliminated options without changing the mapping", () => {
  const { controller, generation } = setup();
  const mapping = controller.getState().mapping;

  controller.processFrame(frame(0), generation);
  controller.processFrame(frame(250), generation);

  expect(controller.getState().holdProgress).toBeGreaterThan(0);

  // Vật phẩm 50–50 vừa loại option-one.
  for (let time = 500; time <= 2000; time += 250) {
    expect(
      controller.processFrame(
        frame(time),
        generation,
        ["option-one"],
      ),
    ).toBeNull();
  }

  expect(controller.getState()).toMatchObject({
    candidateOptionId: null,
    confirmedOptionId: null,
    holdProgress: 0,
  });

  expect(controller.getState().mapping).toBe(mapping);

  // Với rng = 0, ACT_03 được gán cho option-two.
  for (let time = 2250; time < 3750; time += 250) {
    expect(
      controller.processFrame(
        frame(time, { detectedAction: "ACT_03" }),
        generation,
        ["option-one"],
      ),
    ).toBeNull();
  }

  expect(
    controller.processFrame(
      frame(3750, { detectedAction: "ACT_03" }),
      generation,
      ["option-one"],
    ),
  ).toEqual({
    questionId: "question-one",
    optionId: "option-two",
    generation,
  });
});