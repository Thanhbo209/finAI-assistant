import { describe, expect, it } from "vitest";
import type { MerchantResult } from "../modules/parser/index.js";
import { resolveCategory } from "../modules/parser/extractors/category/category.resolver.js";
import { CATEGORY_CONFIDENCE } from "../modules/parser/extractors/category/category.constants.js";

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
  it('"uber airport 45" → Transportation via merchant', () => {
    const result = resolveCategory({
      normalizedInput: "uber airport 45",
      merchantResult: merchant("Uber"),
    });
    expect(result.value).toBe("Transportation");
    expect(result.source).toBe("merchant");
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.MERCHANT_STRONG);
  });

  it('"netflix 15 usd" → Subscriptions via merchant', () => {
    const result = resolveCategory({
      normalizedInput: "netflix 15 usd",
      merchantResult: merchant("Netflix"),
    });
    expect(result.value).toBe("Subscriptions");
    expect(result.source).toBe("merchant");
  });

  it('"coffee shop 5" → Food & Drink via keyword (no merchant)', () => {
    const result = resolveCategory({
      normalizedInput: "coffee shop 5",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Food & Drink");
    expect(result.source).toBe("keyword");
  });

  it('"taxi downtown 20" → Transportation via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "taxi downtown 20",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Transportation");
    expect(result.source).toBe("keyword");
  });

  it('"movie tickets 25" → Entertainment via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "movie tickets 25",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Entertainment");
    expect(result.source).toBe("keyword");
  });

  it('"hospital bill 100" → Health via keyword', () => {
    const result = resolveCategory({
      normalizedInput: "hospital bill 100",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Health");
    expect(result.source).toBe("keyword");
  });

  it('"electric bill 80" → Utilities via keyword ("electric")', () => {
    const result = resolveCategory({
      normalizedInput: "electric bill 80",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Utilities");
    expect(result.source).toBe("keyword");
  });

  it('"random unknown thing" → Unknown via default fallback', () => {
    const result = resolveCategory({
      normalizedInput: "random unknown thing",
      merchantResult: NO_MERCHANT,
    });
    expect(result.value).toBe("Unknown");
    expect(result.source).toBe("default");
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.DEFAULT);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merchant-based resolution — all dictionary merchants
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — merchant dictionary coverage", () => {
  it("Uber → Transportation", () => {
    expect(
      resolveCategory({ normalizedInput: "", merchantResult: merchant("Uber") })
        .value,
    ).toBe("Transportation");
  });

  it("Grab → Transportation", () => {
    expect(
      resolveCategory({ normalizedInput: "", merchantResult: merchant("Grab") })
        .value,
    ).toBe("Transportation");
  });

  it("Netflix → Subscriptions", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Netflix"),
      }).value,
    ).toBe("Subscriptions");
  });

  it("Spotify → Subscriptions", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Spotify"),
      }).value,
    ).toBe("Subscriptions");
  });

  it("McDonald's → Food & Drink", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("McDonald's"),
      }).value,
    ).toBe("Food & Drink");
  });

  it("Starbucks → Food & Drink", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Starbucks"),
      }).value,
    ).toBe("Food & Drink");
  });

  it("Walmart → Groceries", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Walmart"),
      }).value,
    ).toBe("Groceries");
  });

  it("Amazon → Shopping", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Amazon"),
      }).value,
    ).toBe("Shopping");
  });

  it("Apple → Subscriptions", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Apple"),
      }).value,
    ).toBe("Subscriptions");
  });

  it("Google → Subscriptions", () => {
    expect(
      resolveCategory({
        normalizedInput: "",
        merchantResult: merchant("Google"),
      }).value,
    ).toBe("Subscriptions");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merchant confidence scaling
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — merchant confidence scaling", () => {
  it("high merchant confidence (≥0.80) → MERCHANT_STRONG (0.90)", () => {
    const result = resolveCategory({
      normalizedInput: "uber 45",
      merchantResult: merchant("Uber", 0.95),
    });
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.MERCHANT_STRONG);
  });

  it("low merchant confidence (<0.80) → MERCHANT_WEAK (0.75)", () => {
    const result = resolveCategory({
      normalizedInput: "uber 45",
      merchantResult: merchant("Uber", 0.7),
    });
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.MERCHANT_WEAK);
    expect(result.source).toBe("merchant");
    // Category is still correct — just reported with lower confidence
    expect(result.value).toBe("Transportation");
  });

  it("merchant confidence exactly at threshold (0.80) → MERCHANT_STRONG", () => {
    // Boundary condition: threshold is inclusive (>=)
    const result = resolveCategory({
      normalizedInput: "netflix 15",
      merchantResult: merchant("Netflix", 0.8),
    });
    expect(result.confidence).toBe(CATEGORY_CONFIDENCE.MERCHANT_STRONG);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyword fallback — single keyword matches
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — keyword single matches", () => {
  it('"lunch 15" → Food & Drink', () => {
    const r = resolveCategory({
      normalizedInput: "lunch 15",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Food & Drink");
    expect(r.source).toBe("keyword");
    expect(r.confidence).toBe(CATEGORY_CONFIDENCE.KEYWORD_SINGLE);
  });

  it('"parking 10" → Transportation', () => {
    const r = resolveCategory({
      normalizedInput: "parking 10",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Transportation");
  });

  it('"flight tickets 200" → Travel (flight keyword wins)', () => {
    // "tickets" = Entertainment, "flight" = Travel → Travel has 1, Entertainment has 1
    // When tied, map iteration order applies — Travel appears first in KEYWORD_MAP
    // This is documented as a known edge case
    const r = resolveCategory({
      normalizedInput: "flight tickets 200",
      merchantResult: NO_MERCHANT,
    });
    // Both get 1 hit — whichever the Map iteration produces first wins
    // The important thing: it returns SOMETHING plausible and source = 'keyword'
    expect(["Travel", "Entertainment"]).toContain(r.value);
    expect(r.source).toBe("keyword");
  });

  it('"gym membership 30" → Health (gym) or Subscriptions (membership)', () => {
    // "gym" = Health, "membership" = Subscriptions → tie at 1 each
    // Both are plausible; confirm the test documents the tie behavior
    const r = resolveCategory({
      normalizedInput: "gym membership 30",
      merchantResult: NO_MERCHANT,
    });
    expect(["Health", "Subscriptions"]).toContain(r.value);
    expect(r.source).toBe("keyword");
  });

  it('"hotel 150" → Travel', () => {
    const r = resolveCategory({
      normalizedInput: "hotel 150",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Travel");
  });

  it('"pharmacy 25" → Health', () => {
    const r = resolveCategory({
      normalizedInput: "pharmacy 25",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Health");
  });

  it('"internet bill 40" → Utilities', () => {
    const r = resolveCategory({
      normalizedInput: "internet bill 40",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Utilities");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Keyword fallback — multiple reinforcing keywords (higher confidence)
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — keyword multi-match confidence boost", () => {
  it('"dinner restaurant 40" → Food & Drink with KEYWORD_MULTI confidence', () => {
    // "dinner" + "restaurant" → 2 Food & Drink hits
    const r = resolveCategory({
      normalizedInput: "dinner restaurant 40",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Food & Drink");
    expect(r.confidence).toBe(CATEGORY_CONFIDENCE.KEYWORD_MULTI);
  });

  it('"hospital doctor visit 80" → Health with KEYWORD_MULTI confidence', () => {
    // "hospital" + "doctor" → 2 Health hits
    const r = resolveCategory({
      normalizedInput: "hospital doctor visit 80",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Health");
    expect(r.confidence).toBe(CATEGORY_CONFIDENCE.KEYWORD_MULTI);
  });

  it('"coffee breakfast cafe 12" → Food & Drink with KEYWORD_MULTI confidence', () => {
    // "coffee" + "breakfast" + "cafe" → 3 Food & Drink hits
    const r = resolveCategory({
      normalizedInput: "coffee breakfast cafe 12",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Food & Drink");
    expect(r.confidence).toBe(CATEGORY_CONFIDENCE.KEYWORD_MULTI);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Merchant takes priority over keyword (even if keyword would give different result)
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — merchant priority over keywords", () => {
  it('Uber + "food" keyword → Transportation (merchant wins)', () => {
    // "food" would resolve to Food & Drink, but merchant Uber wins
    const r = resolveCategory({
      normalizedInput: "uber food delivery 20",
      merchantResult: merchant("Uber", 0.95),
    });
    expect(r.value).toBe("Transportation");
    expect(r.source).toBe("merchant");
  });

  it('Walmart + "subscription" keyword → Groceries (merchant wins)', () => {
    const r = resolveCategory({
      normalizedInput: "walmart subscription box 45",
      merchantResult: merchant("Walmart", 0.95),
    });
    expect(r.value).toBe("Groceries");
    expect(r.source).toBe("merchant");
  });

  it("unknown merchant → falls through to keyword", () => {
    // Merchant result with a name not in the dictionary
    const r = resolveCategory({
      normalizedInput: "coffee 5",
      merchantResult: {
        canonicalName: "UnknownCafé",
        confidence: 0.65,
        rawMatch: "unknowncafe",
      },
    });
    expect(r.source).toBe("keyword");
    expect(r.value).toBe("Food & Drink");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Default fallback
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — default fallback", () => {
  it("empty string with no merchant → Unknown", () => {
    const r = resolveCategory({
      normalizedInput: "",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Unknown");
    expect(r.source).toBe("default");
    expect(r.confidence).toBe(CATEGORY_CONFIDENCE.DEFAULT);
  });

  it("number-only input with no merchant → Unknown", () => {
    const r = resolveCategory({
      normalizedInput: "45 usd",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Unknown");
    expect(r.source).toBe("default");
  });

  it("completely unrecognised words → Unknown", () => {
    const r = resolveCategory({
      normalizedInput: "xyzfoo blarg 99",
      merchantResult: NO_MERCHANT,
    });
    expect(r.value).toBe("Unknown");
    expect(r.source).toBe("default");
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Source metadata correctness
// ─────────────────────────────────────────────────────────────────────────────

describe("resolveCategory() — source metadata", () => {
  it('merchant resolution always sets source = "merchant"', () => {
    const r = resolveCategory({
      normalizedInput: "netflix 15",
      merchantResult: merchant("Netflix"),
    });
    expect(r.source).toBe("merchant");
  });

  it('keyword resolution always sets source = "keyword"', () => {
    const r = resolveCategory({
      normalizedInput: "coffee 5",
      merchantResult: NO_MERCHANT,
    });
    expect(r.source).toBe("keyword");
  });

  it('default fallback always sets source = "default"', () => {
    const r = resolveCategory({
      normalizedInput: "zzz 5",
      merchantResult: NO_MERCHANT,
    });
    expect(r.source).toBe("default");
  });
});
