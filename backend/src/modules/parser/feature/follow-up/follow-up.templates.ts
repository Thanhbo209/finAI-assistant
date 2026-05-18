/**
 * Template builders — one pure function per field.
 * Each function accepts optional context and returns a natural question string.
 *
 * Rules for all templates:
 *   - Concise: one sentence, no subordinate clauses
 *   - Natural: sounds like a person asking, not a form label
 *   - Non-technical: no field names, no jargon
 *   - Context-aware: use merchant name when available for warmer phrasing
 */

import { MERCHANT_TYPE_HINT } from "./follow-up.constants.js";
import type { FollowUpContext } from "./follow-up.types.js";

/**
 * "How much did you spend?"
 * Context-aware: uses a merchant type hint when the merchant is known.
 *   Netflix → "How much was the Netflix subscription?"
 *   Uber    → "How much was the Uber ride?"
 *   Unknown → "How much did you spend?"
 */

export function buildAmountQuestion(context?: FollowUpContext): string {
  const merchant = context?.merchantName;

  if (merchant) {
    const hint = MERCHANT_TYPE_HINT[merchant] ?? `${merchant} charge`;
    return `How much was the ${hint}?`;
  }

  return "How much did you spend?";
}

/**
 * "Which merchant was this for?"
 * Not context-aware — if merchant is missing we have no name to use.
 */

export function buildMerchantQuestion(_context?: FollowUpContext): string {
  return "Which merchant was this transaction for?";
}

/**
 * "When did this happen?"
 * Generic — relative and explicit date formats both mentioned implicitly.
 * We don't list formats in the question (too technical) — users
 * already demonstrated NL input by typing the original transaction.
 */

export function buildDateQuestion(_context?: FollowUpContext): string {
  return "When did this transaction happen?";
}

/**
 * "What category does this fall under?"
 * Suppressed by default — only called when SUPPRESS_CATEGORY_QUESTION = false.
 * Kept here for completeness and future configurability.
 */

export function buildCategoryQuestion(_context?: FollowUpContext): string {
  return "What category does this relate to?";
}
