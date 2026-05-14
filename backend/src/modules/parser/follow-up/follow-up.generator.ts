import type { MissingField } from "../constants/parser.constants.js";
import {
  MISSING_FIELD_PRIORITY,
  SUPPRESS_CATEGORY_QUESTION,
} from "./follow-up.constants.js";
import {
  buildAmountQuestion,
  buildCategoryQuestion,
  buildDateQuestion,
  buildMerchantQuestion,
} from "./follow-up.templates.js";
import type { GeneratorFollowUpInput } from "./follow-up.types.js";

/**
 * Filter and sort missing fields by product priority.
 * Optionally removes category when SUPPRESS_CATEGORY_QUESTION is enabled.
 * Returns an ordered subset — highest priority first.
 */
function prioritize(missingFields: MissingField[]): MissingField[] {
  const filtered = SUPPRESS_CATEGORY_QUESTION
    ? missingFields.filter((f) => f !== "category")
    : missingFields;

  return [...filtered].sort((a, b) => {
    const ai = MISSING_FIELD_PRIORITY.indexOf(a);
    const bi = MISSING_FIELD_PRIORITY.indexOf(b);
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
  });
}

/**
 * Build a single question for one missing field.
 * Routes to the appropriate template builder.
 */

function buildSingleQuestion(
  field: MissingField,
  input: GeneratorFollowUpInput,
): string {
  const ctx = input.context;

  switch (field) {
    case "amount":
      return buildAmountQuestion(ctx);
    case "merchant":
      return buildMerchantQuestion(ctx);
    case "date":
      return buildDateQuestion(ctx);
    case "category":
      return buildCategoryQuestion(ctx);
  }
}

/**
 * Combine two single-field questions into one natural sentence.
 *
 * Strategy: ask the higher-priority question as the main clause,
 * then append the lower-priority one with ", and".
 *
 * Example:
 *   "How much did you spend?" + "When did this transaction happen?"
 *   → "How much did you spend, and when did this happen?"
 *
 * The second question is shortenped by striping its opening subject
 * ("When did this transaction happen?" → "when did this happen?")
 * to avoid the compound feeling like two separate questions bolted together.
 *
 * This is kept simple intentionally — two templates, one join.
 * More sophisticated sentence fusion belongs in the AI enrichment layer.
 */

function combineTwoQuestions(first: string, second: string): string {
  const firstClause = first.replace(/\?$/, "");

  const secondClause = second.charAt(0).toLowerCase() + second.slice(1);

  return `${firstClause}, and ${secondClause}`;
}

/**
 * Generate a single follow-up question from the missing field set.
 *
 * Returns null when:
 *   - missingFields is empty, OR
 *   - the only missing field is category and SUPPRESS_CATEGORY_QUESTION = true
 *
 * Returns a string (one question) in all other cases.
 *
 * Assembly logic:
 *   1. Filter and sort fields by priority (removes category if suppressed)
 *   2. If nothing remains → null
 *   3. If 1 field remains → single question
 *   4. If 2 fields remain → combined question
 *   5. If >2 fields remain → combined question for top 2 only
 *      (asking about all fields at once is a form, not a conversation)
 *
 * Pure function — no DB, no API, no side effects.
 */

export function generateFollowUp(input: GeneratorFollowUpInput): string | null {
  const prioritized = prioritize(input.missingFields);

  if (prioritized.length === 0) return null;

  const [first, second] = prioritized;

  const firstQuestion = buildSingleQuestion(first!, input);

  if (prioritized.length === 1 || second === undefined) {
    return firstQuestion;
  }

  const secondQuestion = buildSingleQuestion(second, input);
  return combineTwoQuestions(firstQuestion, secondQuestion);
}
