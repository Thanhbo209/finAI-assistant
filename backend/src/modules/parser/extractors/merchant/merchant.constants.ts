/**
 * Confidence scores for merchant extraction.
 * All scoring decisions reference these constants — never inline numbers.
 */

export const MERCHANT_CONFIDENCE = {
  /** Exact alias matched the full normalized input token sequence */
  EXACT_MATCH: 0.95,

  /** A known alias was found as a token substring in the input */
  PARTIAL_MATCH: 0.7,

  /** Multiple candidates found — winning candidate is penalised */
  AMBIGUOUS: 0.15,

  /** No alias matched at all */
  NO_MATCH: 0.1,
};
