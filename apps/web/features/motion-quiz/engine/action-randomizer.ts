import {
  ACTION_IDS,
  type ActionId,
  type OptionActionMapping,
} from "../contracts";

export function createRandomQuestionConfig(
  questionId: string,
  optionIds: readonly string[],
  rng: () => number = Math.random,
): OptionActionMapping {
  if (questionId.trim().length === 0) {
    throw new Error("Question ID must not be blank.");
  }

  if (
    optionIds.length !== 4 ||
    optionIds.some((id) => id.trim().length === 0) ||
    new Set(optionIds).size !== 4
  ) {
    throw new Error("Exactly four unique, nonblank option IDs are required.");
  }

  // Copy the pool so shared data is never modified.
  const actions = [...ACTION_IDS];

  // Fisher–Yates shuffle.
  for (let i = actions.length - 1; i > 0; i -= 1) {
    const random = rng();

    if (!Number.isFinite(random) || random < 0 || random >= 1) {
      throw new Error("Random value must be in [0, 1).");
    }

    const j = Math.floor(random * (i + 1));
    const current = actions[i];
    const selected = actions[j];

    if (current === undefined || selected === undefined) {
      throw new Error("Invalid action index.");
    }

    actions[i] = selected;
    actions[j] = current;
  }

  const optionMap: Record<string, ActionId> = Object.create(null);

  optionIds.forEach((optionId, index) => {
    const actionId = actions[index];

    if (actionId === undefined) {
      throw new Error("Not enough actions.");
    }

    optionMap[optionId] = actionId;
  });

  return {
    questionId,
    optionMap,
  };
}