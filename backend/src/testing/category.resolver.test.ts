import { describe, expect, it } from "vitest";
import type { MerchantResult } from "../modules/parser/index.js";
import { resolveCategory } from "../modules/parser/feature/extractors/category/category.resolver.js";
import { CATEGORY_CONFIDENCE } from "../modules/parser/feature/extractors/category/category.constants.js";
import { CATEGORY } from "../modules/parser/constants/parser.constants.js";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers — build a MerchantResult without repeating fields in every test
// ─────────────────────────────────────────────────────────────────────────────

function merchant(
  canonicalName: string | null,
  confidence = 0.95,
): MerchantResult {
  return {
    canonicalName,
    confidence,
    rawMatch: canonicalName?.toLowerCase() ?? null,
  };
}

const NO_MERCHANT: MerchantResult = {
  canonicalName: null,
  confidence: 0.1,
  rawMatch: null,
};

// ─────────────────────────────────────────────────────────────────────────────
// Spec-required test cases
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — spec examples", () => {
  it('"uber airport 45" → TRANSPORTATION via merchant', () => {
    const result = resolveCategory({
      normalizedInput: "uber airport 45",
      merchantResult: merchant("Uber"),
    });

    expect(result.value).toBe(CATEGORY.TRANSPORTATION);
    expect(result.source).toBe("merchant");
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.MERCHANT_STRONG);
  });

  it('"netflix 15 usd" → SUBSCRIPTIONS via merchant', () => {
    const result = resolveCategory({
      normalizedInput: "netflix 15 usd",
      merchantResult: merchant("Netflix"),
    });

    expect(result.value).toBe(CATEGORY.SUBSCRIPTIONS);
    expect(result.source).toBe("merchant");
  });

  it('"coffee shop 5" → FOOD_DRINK via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "coffee shop 5",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.FOOD_DRINK);
    expect(result.source).toBe("keyword");
  });

  it('"taxi downtown 20" → TRANSPORTATION via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "taxi downtown 20",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.TRANSPORTATION);
    expect(result.source).toBe("keyword");
  });

  it('"movie tickets 25" → ENTERTAINMENT via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "movie tickets 25",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.ENTERTAINMENT);
    expect(result.source).toBe("keyword");
  });

  it('"hospital bill 100" → HEALTH via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "hospital bill 100",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.HEALTH);
    expect(result.source).toBe("keyword");
  });

  it('"electric bill 80" → UTILITIES via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "electric bill 80",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.UTILITIES);
    expect(result.source).toBe("keyword");
  });

  it('"random unknown thing" → UNKNOWN via default fallback', () => {
    const result = resolveCategory({
      normalizedInput: "random unknown thing",
      merchantResult: NO_MERCHANT,
    });

    expect(result.value).toBe(CATEGORY.UNKNOWN);
    expect(result.source).toBe("default");
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.DEFAULT);
  });
});
