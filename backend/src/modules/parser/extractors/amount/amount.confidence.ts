import { AMOUNT_CONFIDENCE } from "./amount.constants.js";
import type { AmountCandidate } from "./amount.types.js";

type AmountConfidenceInput = {
  chosen: AmountCandidate | undefined;
  totalCandidates: number;
};

/**
 * Compute a 0–1 confidence score for the chosen amount candidate.
 *
 * Scoring breakdown (see AMOUNT_CONFIDENCE constants for values):
 *
 *  Base:
 *    +0.40  number found at all
 *
 *  Bonuses (only when a candidate exists):
 *    +0.20  currency was explicitly detected (paired match)
 *    +0.20  number and currency were adjacent (strong pair)
 *
 *  Penalties:
 *    -0.30  multiple number candidates existed (ambiguous input)
 *
 *  No number found:
 *     0.10  (signals "I looked, found nothing" vs 0 which could mean "not run")
 *
 *  Result is capped at AMOUNT_CONFIDENCE.MAX (1.0).
 *
 * Why deterministic scoring matters:
 *   The confidence engine in Step 6 weights this value against merchant and
 *   date scores. If amount confidence were probabilistic or model-driven,
 *   the composite score would be non-reproducible — untestable and
 *   unauditable for a financial product.
 */

export function computeAmountConfidence({
  chosen,
  totalCandidates,
}: AmountConfidenceInput): number {
  if (chosen === null || chosen === undefined) {
    return AMOUNT_CONFIDENCE.NO_NUMBER;
  }

  let score = AMOUNT_CONFIDENCE.NUMBER_FOUND;

  if (chosen.matchStrength === "paired") {
    score += AMOUNT_CONFIDENCE.CURRENCY_DETECTED;
    score += AMOUNT_CONFIDENCE.STRONG_PAIR;
  }

  if (totalCandidates > 1) {
    score -= AMOUNT_CONFIDENCE.AMBIGUOUS_MULTIPLE;
  }

  return Math.min(score, AMOUNT_CONFIDENCE.MAX);
}
