/**
 * Minimum confidence thresholds for each field.
 * A field is considered "present" when its extraction confidence meets
 * or exceeds its threshold.
 *
 * These are product decisions, not technical ones.
 * The comment on each threshold explains the rationale.
 */
export const MIN_CONFIDENCE = {
  /**
   * Amount: 0.30
   * We require some signal — a null value or near-zero confidence (e.g. 0.10
   * "no number found") always triggers missing. But a bare number with no
   * currency context (confidence 0.40) is enough to proceed with user confirmation.
   * Financial data with an unverified amount is still more useful than nothing —
   * the human-in-the-loop confirmation step will catch errors.
   */
  AMOUNT: 0.3,

  /**
   * Merchant: 0.20
   * Deliberately low. Merchant is optional context, not a required field.
   * "coffee 5" is a perfectly valid transaction with no merchant.
   * We only flag merchant missing when confidence is extremely low
   * (essentially "no signal at all") AND the system couldn't even make
   * a weak guess. This avoids pestering users for merchant clarification
   * on generic purchases like "lunch" or "groceries".
   */
  MERCHANT: 0.2,
} as const;

/**
 * Whether UNKNOWN category counts as a missing field.
 *
 * DECISION: false — UNKNOWN is an acceptable fallback, not a missing field.
 *
 * Rationale:
 *   Category is inferred from merchant or keyword context. When neither
 *   exists, we don't need to block the transaction or ask a follow-up.
 *   Users can recategorise after saving. Forcing a category clarification
 *   for every "coffee 5" with no recognized merchant would create UX friction
 *   with minimal data-quality benefit at MVP scale. UNKNOWN is a valid DB
 *   value that analytics can handle.
 *
 *   When the product matures (Phase 4+), a user-correction signal on
 *   UNKNOWN transactions trains the category model — so UNKNOWN records
 *   have future value.
 */
export const UNKNOWN_CATEGORY_IS_MISSING = false as const;

/**
 * Whether a default-fallback date counts as a missing field.
 *
 * DECISION: false — default date is an acceptable implicit value.
 *
 * Rationale:
 *   The vast majority of expense entries refer to the current day.
 *   Asking "when did this happen?" for every transaction that lacks an
 *   explicit date would add a follow-up to almost every input — severe UX
 *   regression. The date default (today) is correct ~80% of the time.
 *   Users who need a different date can provide it explicitly ("yesterday",
 *   "jan 12") and extraction handles it. The human-in-the-loop preview
 *   shows the resolved date, so users can spot and correct a wrong date
 *   before confirming.
 */
export const DEFAULT_DATE_IS_MISSING = false as const;
