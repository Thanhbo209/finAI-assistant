/**
 * Field weights for the 3-factor composite confidence score.
 * Must sum to exactly 1.0 — enforced by the runtime guard below.
 *
 * Rationale:
 *
 *   amount (0.50) — The transaction's core financial fact. A wrong or missing
 *   amount makes the record useless. Highest weight reflects this severity.
 *
 *   merchant (0.35) — Strong signal for category inference, analytics, and
 *   recurring detection. Missing merchant is tolerable; wrong merchant
 *   misdirects every downstream consumer.
 *
 *   category (0.15) — Inferred context. UNKNOWN is an acceptable value.
 *   Category errors are easiest to correct post-save. Smallest weight.
 *
 * Date is intentionally excluded from confidence scoring.
 *   transactionDate defaults to referenceDate (today), which is correct
 *   ~80% of the time. Penalising the score for a missing explicit date
 *   would add noise without improving trust in the financial record.
 */

export const FIELD_WEIGHTS = {
  amount: 0.5,
  merchant: 0.35,
  category: 0.1,
} as const satisfies Record<string, number>;

// Compile-time guard: weights must sum to 1.0
// If you change any weight, TypeScript will not catch the sum drift —
// the runtime assertion in confidence.composer.ts handles that.

// Runtime invariant — fires immediately if weights drift from 1.0
const WEIGHTS_SUM =
  FIELD_WEIGHTS.amount + FIELD_WEIGHTS.merchant + FIELD_WEIGHTS.category;
if (Math.abs(WEIGHTS_SUM - 1.0) > 0.0001) {
  throw new Error(
    `FIELD_WEIGHTS must sum to 1.0 — current sum: ${WEIGHTS_SUM}`,
  );
}

/**
 * Missing-field penalties applied AFTER weighted composition.
 *
 * These are additive deductions from the weighted score.
 * They exist to push the composite score below actionable thresholds
 * when a critical field is absent — even if the other fields scored well.
 *
 * Rationale per penalty:
 *
 *   MISSING_AMOUNT (0.30) — Severe. A transaction with no amount cannot
 *   be persisted as a meaningful financial record. The penalty is large
 *   enough to push the score below CONFIDENCE.MEDIUM (0.65) in almost
 *   all cases, ensuring the human-in-the-loop step surfaces it.
 *
 *   MISSING_MERCHANT (0.05) — Mild. Many legitimate transactions have no
 *   known merchant ("coffee 5", "lunch 12"). We penalise slightly to
 *   reflect reduced analytics quality, but not enough to block a
 *   high-confidence amount + date parse.
 *
 *   MISSING_DATE (0.08) — Mild-moderate. Date defaults to today which is
 *   usually right, but when we had to fall back to the default AND it was
 *   flagged as missing, the uncertainty warrants a slightly larger penalty
 *   than merchant.
 *
 *   UNKNOWN_CATEGORY (0.02) — Negligible. UNKNOWN is an acceptable value.
 *   A tiny penalty acknowledges reduced analytics value without punishing
 *   the overall parse quality meaningfully.
 *
 * Why not simply use the missing-fields list to zero out those fields?
 *   Because zeroing produces severe over-penalization: a transaction with
 *   "amount=45, no merchant" would score only 0.55 (40% + 15% + 10% =
 *   0.65) — which is below the confidence floor we'd want for that input.
 *   Proportional penalties are more calibrated and less surprising.
 */

export const MISSING_FIELD_PENALTIES = {
  MISSING_AMOUNT: 0.35,
  MISSING_MERCHANT: 0.05,
  UNKNOWN_CATEGORY: 0.02,
} as const;

/** Hard bounds — composite score is clamped to this range. */
export const SCORE_BOUNDS = {
  MIN: 0.0,
  MAX: 1.0,
} as const;
