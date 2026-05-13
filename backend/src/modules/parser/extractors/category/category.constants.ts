/**
 * Confidence scores for category resolution by source.
 * Higher precision of the signal → higher confidence floor.
 *
 * Merchant-based resolution is more reliable than keyword-based because:
 *   - The merchant → category mapping is curated and deterministic
 *   - Keywords can appear in many contexts ("coffee table" ≠ Food & Drink)
 *
 * These are floors, not fixed values.
 * The resolver may scale these based on merchant confidence passed in.
 */
export const CATEGORY_CONFIDENCE = {
  /** Merchant-based: merchant was identified + it has a known category */
  MERCHANT_STRONG: 0.9,
  /** Merchant-based: merchant identified but with lower match confidence */
  MERCHANT_WEAK: 0.75,

  /** Keyword-based: multiple reinforcing keywords matched */
  KEYWORD_MULTI: 0.72,
  /** Keyword-based: exactly one keyword matched */
  KEYWORD_SINGLE: 0.6,

  /** Default: no merchant or keyword matched */
  DEFAULT: 0.2,
} as const;

/**
 * Threshold below which a merchant result is considered "weak".
 * Maps to MERCHANT_WEAK confidence on the category result.
 */
export const MERCHANT_CONFIDENCE_THRESHOLD = 0.8 as const;
