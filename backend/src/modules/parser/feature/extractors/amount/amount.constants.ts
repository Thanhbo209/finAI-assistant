/**
 * All patterns and scoring constants for amount extraction.
 * Extractors never define regex inline — always import from here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Currency symbols and keywords
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Currency codes as they appear in normalized input.
 * Normalization has already converted "dollars"/"dollar" → "usd" etc.
 * These are the only forms we need to recognize.
 */

export const CURRENCY_CODES = {
  USD: "USD",
  VND: "VND",
  EUR: "EUR",
  GBP: "GBP",
  JPY: "JPY",
} as const;

export type CurrencyCode = (typeof CURRENCY_CODES)[keyof typeof CURRENCY_CODES];

export const DEFAULT_CURRENCY: CurrencyCode = CURRENCY_CODES.USD;

/**
 * Maps normalized currency tokens (post-normalization-pipeline) to canonical codes.
 * Keys must match what the normalization layer produces — lowercase only.
 */

export const CURRENCY_TOKEN_MAP: Readonly<Record<string, CurrencyCode>> = {
  usd: CURRENCY_CODES.USD,
  $: CURRENCY_CODES.USD,
  vnd: CURRENCY_CODES.VND,
  eur: CURRENCY_CODES.EUR,
  gbp: CURRENCY_CODES.GBP,
  jpy: CURRENCY_CODES.JPY,
};

// Regex patterns — each pattern has a named comment explaining what it matches
/**
 * Matches a bare number (integer or decimal) surrounded by word boundaries.
 * Examples: "45", "12.50", "6"
 *
 * Does NOT match numbers inside longer words (e.g. "h264" or "3rd").
 * The negative lookbehind (?<!\.) prevents matching ".45" as a standalone number
 * (which could be part of a version string like "v1.45").
 */
export const PATTERN_BARE_NUMBER =
  /(?<!\.)(?<!\d)\b(\d+(?:\.\d{1,2})?)\b(?!\.\d)/g;

/**
 * Matches a currency symbol immediately preceding a number: $45, $12.50
 * Capturing group 1 = symbol, group 2 = number
 */

export const PATTERN_CURRENCY_PREFIX = /(\$)\s*(\d+(?:\.\d{1,2})?)\b/g;
/**
 * Matches a number immediately followed by a currency symbol: 45$, 12.50$
 * Capturing group 1 = number, group 2 = symbol
 */
export const PATTERN_CURRENCY_SUFFIX = /\b(\d+(?:\.\d{1,2})?)\s*(\$)/g;

/**
 * Matches a number followed closely (within 1–2 tokens) by a currency code.
 * Examples: "45 usd", "45usd"
 * Capturing group 1 = number, group 2 = currency code
 */
export const PATTERN_NUMBER_THEN_CURRENCY =
  /\b(\d+(?:\.\d{1,2})?)\s*(usd|eur|gbp|vnd|jpy)\b/g;

/**
 * Matches a currency code followed closely by a number.
 * Examples: "usd 45", "eur 12.50"
 * Capturing group 1 = currency code, group 2 = number
 */
export const PATTERN_CURRENCY_THEN_NUMBER =
  /\b(usd|eur|gbp|vnd|jpy)\s+(\d+(?:\.\d{1,2})?)\b/g;

// Confidence scoring weights — no magic numbers in extractor logic
export const AMOUNT_CONFIDENCE = {
  /** Base score when a number is found at all */
  NUMBER_FOUND: 0.4,
  /** Bonus when a currency symbol or code accompanies the number */
  CURRENCY_DETECTED: 0.2,
  /** Bonus when number and currency are adjacent (strong paired match) */
  STRONG_PAIR: 0.2,
  /** Penalty when multiple candidate numbers exist — less certainty */
  AMBIGUOUS_MULTIPLE: 0.3,
  /** Score when no number is found at all */
  NO_NUMBER: 0.1,
  /** Hard cap */
  MAX: 1.0,
} as const;

/**
 * When multiple bare numbers exist and no currency ties one to the transaction,
 * we apply this selection rule (documented for test auditability):
 *
 *   LAST_NUMBER: take the last number in the string.
 *
 * Rationale: in practice, users append amounts at the end of descriptions.
 * "uber 45 airport 10" most likely means the trip cost $10 (last figure).
 * "spent 20 got change 5" — the transaction is $20.
 *
 * This heuristic is wrong in some cases. That is acceptable: confidence is
 * penalised for ambiguous input, which triggers a follow-up in Step 7.
 *
 * Change this constant to switch the strategy globally without hunting callsites.
 */
export const MULTI_NUMBER_STRATEGY = "LAST_NUMBER" as const;
