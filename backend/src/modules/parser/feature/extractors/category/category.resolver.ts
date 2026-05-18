import {
  CATEGORY,
  type Category,
} from "../../../constants/parser.constants.js";
import type { CategoryResult } from "../../../types/extractor.types.js";
import { MERCHANT_DICTIONARY } from "../merchant/merchant.dictionary.js";
import {
  CATEGORY_CONFIDENCE,
  MERCHANT_CONFIDENCE_THRESHOLD,
} from "./category.constants.js";
import { KEYWORD_MAP } from "./category.keywords.js";
import type { ResolveCategoryInput } from "./category.types.js";

/**
 * Pre-built lookup: canonicalName → defaultCategory.
 * Built once at module load — O(1) lookup per resolve call.
 * Derived from the merchant dictionary so there is a single source of truth:
 * adding a merchant to the dictionary automatically makes its category
 * available here without any additional changes.
 */

/**
 * Stage 1 — Merchant-based resolution.
 *
 * Returns a CategoryResult when the incoming merchantResult identifies a
 * known merchant whose category is in the dictionary.
 * Returns null when the merchant is unknown or the merchant match was absent.
 *
 * Confidence is scaled by the merchant extraction confidence:
 *   - High merchant confidence (≥ threshold) → MERCHANT_STRONG (0.90)
 *   - Lower merchant confidence              → MERCHANT_WEAK   (0.75)
 *
 * Why scale by merchant confidence?
 *   The category result is only as reliable as the merchant identification
 *   that produced it. If the merchant was identified with a partial match
 *   at 0.70 confidence, the category should not be reported with 0.90 confidence.
 */

const MERCHANT_CATEGORY_MAP: ReadonlyMap<string, Category> = new Map(
  MERCHANT_DICTIONARY.map((entry) => [
    entry.canonicalName,
    entry.defaultCategory,
  ]),
);

function resolveFromMerchant(
  merchantName: string | null,
  merchantConfidence: number,
): CategoryResult | null {
  if (merchantName === null) return null;

  const category = MERCHANT_CATEGORY_MAP.get(merchantName);
  if (category === undefined) return null;

  const confidence =
    merchantConfidence >= MERCHANT_CONFIDENCE_THRESHOLD
      ? CATEGORY_CONFIDENCE.MERCHANT_STRONG
      : CATEGORY_CONFIDENCE.MERCHANT_WEAK;

  return { value: category, confidence, source: "merchant" };
}

function resolveFromKeywords(normalizedInput: string): CategoryResult | null {
  // Collect all matching keywords grouped by category
  const categoryHits = new Map<Category, number>();

  for (const { keyword, category } of KEYWORD_MAP) {
    if (normalizedInput.includes(keyword)) {
      categoryHits.set(category, (categoryHits.get(category) ?? 0) + 1);
    }
  }

  if (categoryHits.size === 0) return null;

  // Find the category with the most hits (plurailty wins)
  let winningCategory: Category = CATEGORY.UNKNOWN;
  let maxHits = 0;

  for (const [category, hits] of categoryHits) {
    if (hits > maxHits) {
      maxHits = hits;
      winningCategory = category;
    }
  }

  const confidence =
    maxHits > 1
      ? CATEGORY_CONFIDENCE.KEYWORD_MULTI
      : CATEGORY_CONFIDENCE.KEYWORD_SINGLE;

  return { value: winningCategory, confidence, source: "keyword" };
}

/**
 * Stage 3 — Default fallback.
 * Returns UNKNOWN with low confidence when all other stages fail.
 */

function resolveDefault(): CategoryResult {
  return {
    value: CATEGORY.UNKNOWN,
    confidence: CATEGORY_CONFIDENCE.DEFAULT,
    source: "default",
  };
}

// Public entry point

/**
 * Resolve the transaction category from merchant context and/or keyword heuristics.
 *
 * Resolution order (first match wins):
 *   1. Merchant dictionary lookup (highest precision)
 *   2. Keyword heuristics in normalized input (medium precision)
 *   3. Default UNKNOWN (fallback)
 *
 * Pure function — no DB, no API, no side effects.
 * Same input always produces same output.
 */

export function resolveCategory({
  normalizedInput,
  merchantResult,
}: ResolveCategoryInput): CategoryResult {
  return (
    resolveFromMerchant(
      merchantResult.canonicalName,
      merchantResult.confidence,
    ) ??
    resolveFromKeywords(normalizedInput) ??
    resolveDefault()
  );
}
