import {
  FIELD_WEIGHTS,
  MISSING_FIELD_PENALTIES,
  SCORE_BOUNDS,
} from "./confidence.constants.js";
import type {
  ComposeConfidenceInput,
  ConfidenceBreakdown,
  ConfidenceResult,
} from "./confidence.types.js";

// Runtime weight-sum guard
const EXPECTED_WEIGHT_SUM = 1.0;
const WEIGHT_SUM_TOLERANCE = 0.0001;
const actualWeightSum =
  FIELD_WEIGHTS.amount +
  FIELD_WEIGHTS.merchant +
  FIELD_WEIGHTS.date +
  FIELD_WEIGHTS.category;

if (Math.abs(actualWeightSum - EXPECTED_WEIGHT_SUM) > WEIGHT_SUM_TOLERANCE) {
  throw new Error(
    `FIELD_WEIGHTS must sum to 1.0 — current sum: ${actualWeightSum}. ` +
      `Update confidence.constants.ts to fix the drift.`,
  );
}

// Penalty calculator — pure, individually testable
/**
 * Compute the total penalty to subtract from the weighted score.
 *
 * Important design choices:
 *
 * 1. Penalties are applied AFTER weighted composition, not instead of it.
 *    This means a high-confidence amount still contributes its 0.40 weight
 *    even when merchant is missing — we don't zero out the merchant slot.
 *    This avoids the "punished twice" problem where a null merchant both
 *    contributes 0 to the weighted sum AND takes a penalty deduction.
 *
 * 2. Penalties only fire when the field appears in missingFields.
 *    Low-confidence (but present) fields are penalised naturally through
 *    their lower per-field confidence feeding into the weighted score.
 *    We do NOT add extra penalty on top of already-downgraded confidence.
 *
 * 3. Unknown category incurs only the UNKNOWN_CATEGORY penalty, not
 *    MISSING_MERCHANT or any other cross-field penalty.
 */

function computePenalties(
  missingFields: ComposeConfidenceInput["missingFields"],
  categoryValue: string,
): number {
  let penalty = 0;

  if (missingFields.includes("amount"))
    penalty += MISSING_FIELD_PENALTIES.MISSING_AMOUNT;
  if (missingFields.includes("merchant"))
    penalty += MISSING_FIELD_PENALTIES.MISSING_MERCHANT;
  if (missingFields.includes("date"))
    penalty += MISSING_FIELD_PENALTIES.MISSING_DATE;
  if (categoryValue === "Unknown")
    penalty += MISSING_FIELD_PENALTIES.UNKNOWN_CATEGORY;

  return penalty;
}

// Public entry point
/**
 * Compose a single 0–1 transaction confidence score from all extractor outputs.
 *
 * Algorithm (two explicit stages):
 *
 *   Stage 1 — Weighted sum
 *     Each field contributes: field_confidence × field_weight
 *     Sum of all four contributions = rawWeightedScore
 *
 *   Stage 2 — Penalty deductions
 *     For each critical field flagged as missing, subtract a proportional
 *     penalty from the raw score.
 *     Result is clamped to [SCORE_BOUNDS.MIN, SCORE_BOUNDS.MAX].
 *
 * Returns both the final score and a full breakdown for auditability.
 * The breakdown is the answer to "why did this transaction score X?" —
 * exposable in debug logs, admin dashboards, and future AI training signals.
 *
 * Pure function — no DB, no API, no side effects.
 */

export function composeConfidence(
  input: ComposeConfidenceInput,
): ConfidenceResult {
  const { amountResult, merchantResult, categoryResult, missingFields } = input;

  // ── Stage 1: weighted sum ──────────────────────────────────────────────────
  const weightedAmount = amountResult.confidence * FIELD_WEIGHTS.amount;
  const weightedMerchant = merchantResult.confidence * FIELD_WEIGHTS.merchant;
  const weightedCategory = categoryResult.confidence * FIELD_WEIGHTS.category;

  const rawWeightedScore = weightedAmount + weightedMerchant + weightedCategory;

  // ── Stage 2: penalty deductions ────────────────────────────────────────────
  const totalPenalty = computePenalties(missingFields, categoryResult.value);

  const finalScore = Math.min(
    Math.max(rawWeightedScore - totalPenalty, SCORE_BOUNDS.MIN),
    SCORE_BOUNDS.MAX,
  );

  const breakdown: ConfidenceBreakdown = {
    weightedAmount,
    weightedMerchant,
    weightedCategory,
    rawWeightedScore,
    totalPenalty,
    finalScore,
  };

  return { score: finalScore, breakdown };
}
