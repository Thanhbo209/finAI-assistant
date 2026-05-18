import { MERCHANT_CONFIDENCE } from "./merchant.constants.js";
import type { MerchantCandidate } from "./merchant.types.js";

export interface MerchantConfidenceInput {
  chosen: MerchantCandidate | null;
  totalCandidates: number;
}

/**
 * Compute a 0–1 confidence score for the selected merchant candidate.
 *
 * Scoring breakdown:
 *
 *  No candidate found:
 *    → NO_MATCH (0.10) — signals "scanned, found nothing"
 *
 *  Candidate found, matchType = 'exact':
 *    → EXACT_MATCH (0.95) base
 *
 *  Candidate found, matchType = 'partial':
 *    → PARTIAL_MATCH (0.70) base
 *
 *  Ambiguity penalty (more than one candidate in pool):
 *    → subtract AMBIGUOUS (0.15) from base
 *
 *  Result capped at 1.0.
 *
 * Why keep this separate from the selector?
 *   The selector answers "which candidate wins".
 *   The confidence scorer answers "how certain are we".
 *   Mixing them would make both harder to test and harder to tune
 *   independently — confidence weights change more often than
 *   tie-breaking rules.
 */
export function computeMerchantConfidence({
  chosen,
  totalCandidates,
}: MerchantConfidenceInput): number {
  if (chosen === null) return MERCHANT_CONFIDENCE.NO_MATCH;

  const base =
    chosen.matchType === "exact"
      ? MERCHANT_CONFIDENCE.EXACT_MATCH
      : MERCHANT_CONFIDENCE.PARTIAL_MATCH;

  const penalty = totalCandidates > 1 ? MERCHANT_CONFIDENCE.AMBIGUOUS : 0;

  return Math.min(base - penalty, 1.0);
}
