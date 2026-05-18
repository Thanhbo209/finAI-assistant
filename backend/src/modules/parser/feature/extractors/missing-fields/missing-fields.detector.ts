// ─────────────────────────────────────────────────────────────────────────────
// Per-field checks — pure functions, individually testable
// ─────────────────────────────────────────────────────────────────────────────

import {
  MISSING_FIELD,
  type MissingField,
} from "../../../constants/parser.constants.js";
import type {
  AmountResult,
  CategoryResult,
  DateResult,
  MerchantResult,
} from "../../../types/extractor.types.js";
import {
  DEFAULT_DATE_IS_MISSING,
  MIN_CONFIDENCE,
  UNKNOWN_CATEGORY_IS_MISSING,
} from "./missing-fields.constants.js";
import type { DetectMissingFieldsInput } from "./missing-fields.types.js";

/**
 * Amount is missing when:
 *   - value is null (no number was found at all), OR
 *   - confidence is below MIN_CONFIDENCE.AMOUNT (ambiguous/unreliable number)
 *
 * A null value with confidence 0.10 ("no number found") and a bare ambiguous
 * number with confidence 0.10 (two numbers found, penalty applied) both trigger
 * this — the confidence threshold catches both cases without needing a separate
 * null check, but we keep both conditions explicit for clarity.
 */

export function isAmountMissing(result: AmountResult): boolean {
  return result.value === null || result.confidence < MIN_CONFIDENCE.AMOUNT;
}

/**
 * Merchant is missing ONLY when confidence is extremely low.
 * We never require merchant — see MIN_CONFIDENCE.MERCHANT rationale.
 *
 * This function returns true only for the "no useful signal at all" case:
 *   - null canonical name AND confidence at or near the no-match floor.
 *
 * It intentionally returns false when:
 *   - canonical name is null but confidence is at MERCHANT_CONFIDENCE.PARTIAL_MATCH (0.70)
 *     (partial scanner found something)
 *   - canonical name is null but we simply have a generic description with no merchant
 *     (confidence 0.10 = NO_MATCH constant — exactly at the threshold boundary)
 *
 * Wait — confidence 0.10 IS below 0.20. So "coffee 5" (no merchant) WILL pass
 * isAmountMissing=false and isMerchantMissing=false here. Let's trace:
 *   - extractMerchant("coffee 5") → { canonicalName: null, confidence: 0.10 }
 *   - 0.10 < 0.20 → true → merchant IS flagged missing
 *
 * This is CORRECT. "coffee 5" has a null merchant at 0.10 confidence.
 * The threshold is deliberately set to 0.20 so that a partial match (0.70)
 * clears it, but a true no-match (0.10) is flagged.
 * See rationale: merchant IS optional — but flagging it gives the follow-up
 * system (Step 9) an opportunity to ask if needed. The follow-up generator
 * will decide whether to surface it based on overall transaction quality.
 */

export function isMerchantMissing(result: MerchantResult): boolean {
  return result.confidence < MIN_CONFIDENCE.MERCHANT;
}

/**
 * Category is missing only when UNKNOWN_CATEGORY_IS_MISSING is true.
 * Current product decision: false — UNKNOWN is an acceptable value.
 * This function is kept as a named check so the decision is one constant
 * change away from affecting behaviour system-wide.
 */

export function isCategoryMissing(result: CategoryResult): boolean {
  if (!UNKNOWN_CATEGORY_IS_MISSING) return false;

  return result.value === "UNKNOWN";
}

/**
 * Date is missing only when DEFAULT_DATE_IS_MISSING is true.
 * Current product decision: false — default (today) is acceptable.
 * Same rationale as isCategoryMissing.
 */

export function isDateMissing(result: DateResult): boolean {
  if (!DEFAULT_DATE_IS_MISSING) return false;

  return result.source === "default";
}

export function detectMissingFields({
  amountResult,
  merchantResult,
  categoryResult,
}: DetectMissingFieldsInput): MissingField[] {
  const missing: MissingField[] = [];

  if (isAmountMissing(amountResult)) missing.push(MISSING_FIELD.AMOUNT);
  if (isMerchantMissing(merchantResult)) missing.push(MISSING_FIELD.MERCHANT);
  if (isCategoryMissing(categoryResult)) missing.push(MISSING_FIELD.CATEGORY);

  return missing;
}
