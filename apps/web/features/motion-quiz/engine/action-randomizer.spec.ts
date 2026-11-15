import { test, expect } from "@playwright/test";
import { ACTION_IDS } from "../contracts";
import { createRandomQuestionConfig } from "./action-randomizer";

const optionIds = ["option-one", "option-two", "__proto__", "option-four"];

test.describe("motion action randomizer", () => {
  test("maps exact option IDs to four distinct valid actions", () => {
    const result = createRandomQuestionConfig(
      "question-1",
      optionIds,
      () => 0.5,
    );

    expect(result.questionId).toBe("question-1");
    expect(Object.keys(result.optionMap)).toEqual(optionIds);

    const actions = Object.values(result.optionMap);
    expect(actions).toHaveLength(4);
    expect(new Set(actions).size).toBe(4);

    for (const action of actions) {
      expect(ACTION_IDS).toContain(action);
    }

    expect(
      Object.prototype.hasOwnProperty.call(result.optionMap, "__proto__"),
    ).toBe(true);
  });

  test("has a predictable result with a controlled RNG", () => {
    const result = createRandomQuestionConfig(
      "question-1",
      optionIds,
      () => 0,
    );

    expect(Object.values(result.optionMap)).toEqual([
      "ACT_02",
      "ACT_03",
      "ACT_04",
      "ACT_05",
    ]);
  });

  test("does not mutate option IDs or the shared action pool", () => {
    const originalIds = [...optionIds];
    const originalActions = [...ACTION_IDS];

    createRandomQuestionConfig("question-1", optionIds, () => 0.5);

    expect(optionIds).toEqual(originalIds);
    expect(ACTION_IDS).toEqual(originalActions);
  });

  test("rejects invalid question and option IDs", () => {
    expect(() =>
      createRandomQuestionConfig(" ", optionIds),
    ).toThrow("Question ID must not be blank.");

    const invalidOptions = [
      ["a", "b", "c"],
      ["a", "b", "c", "d", "e"],
      ["a", "a", "c", "d"],
      ["a", " ", "c", "d"],
    ];

    for (const ids of invalidOptions) {
      expect(() =>
        createRandomQuestionConfig("question-1", ids),
      ).toThrow("Exactly four unique, nonblank option IDs are required.");
    }
  });

  test("rejects invalid RNG values", () => {
    for (const value of [-0.1, 1, NaN, Infinity]) {
      expect(() =>
        createRandomQuestionConfig("question-1", optionIds, () => value),
      ).toThrow("Random value must be in [0, 1).");
    }
  });
});